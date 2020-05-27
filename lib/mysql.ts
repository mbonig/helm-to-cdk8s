import {Construct, ConstructOptions, Node} from "constructs";
import {Deployment, PodSecurityContext, Probe, ResourceRequirements, Secret, Volume, VolumeMount} from "../imports/k8s";
import {base64} from "../test/utils";
import {getKeys, randAlphaNum, undefinedIfEmpty} from "./utils";
import {Chart} from "cdk8s";

export interface ExtraVolume {
    name: string;
    emptyDir?: any;
    secret?: any;
}

export interface ExtraVolumeMount {
    name: string;
    mountPath: string;
    readOnly: boolean;
}

export interface ExtraInitContainer {
    name: string;
    image: string;
    command: string[];
}

interface Persistence {
    enabled: boolean;
    accessMode: string;
    size: string;
    annotations: any;
    subPath?: string;
}

interface Metrics {
    enabled: boolean;
    image: string;
    imageTag: string;
    imagePullPolicy: ImagePullPolicy;
    resources: ResourceRequirements;
    annotations: {};
    livenessProbe: { initialDelaySeconds: 15, timeoutSeconds: 5 };
    readinessProbe: { initialDelaySeconds: 5, timeoutSeconds: 1 };
    flags: [];
    serviceMonitor: { enabled: false, additionalLabels: {} };
}

interface Service {
    annotations: {};
    type: 'ClusterIP';
    port: 3306;
}

interface ServiceAccount {
    create: false;
}

interface Certificate {
    name: string;
    ca: string;
    cert: string;
    key: string;
}

interface Ssl {
    enabled: boolean;
    secret: string;
    certificates: Certificate[];
}

interface InitContainer {
    resources: ResourceRequirements
}

enum ImagePullPolicy {
    'Always' = "Always",
    'Never' = "Never",
    'IfNotPresent' = "IfNotPresent"
}

interface TestFramework {
    enabled: boolean;
    image: string;
    tag: string;
}

interface Busybox {
    image: string;
    tag: string;
}

interface Strategy {
    type: string;
}

interface ImagePullSecrets {
    name: string;
}

interface PodSecurityContextEnabled extends PodSecurityContext {
    enabled: boolean;
}

export interface MySqlOptions extends ConstructOptions {
    allowEmptyRootPassword: boolean;
    priorityClassName: string;
    nameOverride?: string;
    fullnameOverride?: string;
    schedulerName: string;
    imagePullSecrets: ImagePullSecrets[];
    args: string[];
    image: string;
    imageTag: string;
    strategy: Strategy;
    busybox: Busybox;
    existingSecret: string;
    testFramework: TestFramework;
    imagePullPolicy: ImagePullPolicy;
    extraVolumes: ExtraVolume[];
    extraVolumeMounts: ExtraVolumeMount[];
    extraInitContainers: ExtraInitContainer[];
    nodeSelector: any;
    affinity: any;
    tolerations: any[];
    livenessProbe: Probe;
    readinessProbe: Probe;
    persistence: Persistence;
    securityContext: PodSecurityContextEnabled;
    resources: ResourceRequirements;
    configurationFilesPath: string;
    configurationFiles: any;
    initializationFiles: any;
    mysqlAllowEmptyPassword: boolean;
    mysqlDatabase: string;
    mysqlPassword: string;
    mysqlRootPassword: string;
    mysqlUser: string;
    metrics: Metrics;
    service: Service;
    serviceAccount: ServiceAccount;
    ssl: Ssl;
    deploymentAnnotations: any;
    podAnnotations: any;
    podLabels: any;
    initContainer: InitContainer;
    timezone?: string;
}


export class MySql extends Construct {
    private readonly releaseName: string;
    private readonly fullname: string;
    // @ts-ignore
    private chart: Node;
    private secretName: string = "";

    constructor(scope: Construct, id: string, private options: MySqlOptions) {
        super(scope, id, options);
        this.chart = Node.of(Chart.of(this));
        this.releaseName = this.chart.id;
        this.fullname = this.getFullname();
        this.createSecrets();
        this.createDeployment();
    }

    private createDeployment() {
        let liveAndReadinessProbeCommands = [
            ...(this.options.mysqlAllowEmptyPassword ?
                [
                    'mysqladmin', 'ping'
                ] :
                [
                    'sh',
                    '-c',
                    "mysqladmin ping -u root -p${MYSQL_ROOT_PASSWORD}"
                ]),

        ];
        let volumeMounts: VolumeMount[] = [
            {
                mountPath: "/var/lib/mysql",
                name: "data",
                subPath: this.options.persistence.subPath
            }
        ];

        if (undefinedIfEmpty(this.options.configurationFiles)) {
            // @ts-ignore
            for (const {key} of getKeys(this.options.configurationFiles)) {
                volumeMounts.push({
                    name: 'configurations',
                    mountPath: `${this.options.configurationFilesPath}${key}`,
                    subPath: key

                });
            }
        }

        if (undefinedIfEmpty(this.options.initializationFiles)) {
            volumeMounts.push({
                name: 'migrations',
                mountPath: '/docker-entrypoint-initdb.d'
            });
        }


        if (this.options.ssl?.enabled) volumeMounts.push({"mountPath": "/ssl", "name": "certificates"});
        if (this.options.extraVolumeMounts) {
            for (const extraVolumeMount of this.options.extraVolumeMounts) {
                // @ts-ignore
                volumeMounts.push(extraVolumeMount);
            }
        }

        let env = [
            this.options.allowEmptyRootPassword ? {
                name: "MYSQL_ALLOW_EMPTY_PASSWORD",
                value: "true"
            } : {
                "name": "MYSQL_ROOT_PASSWORD",
                "valueFrom": {
                    "secretKeyRef": {
                        "key": "mysql-root-password",
                        "name": this.options.existingSecret || `${this.releaseName}-mysql`
                    }
                }
            },
            {
                "name": "MYSQL_PASSWORD",
                "valueFrom": {
                    "secretKeyRef": {
                        "key": "mysql-password",
                        "name": this.options.existingSecret || `${this.releaseName}-mysql`,
                        optional: this.options.mysqlAllowEmptyPassword || !this.options.mysqlUser ? true : undefined
                    }
                }
            },
            {
                "name": "MYSQL_USER",
                "value": this.options.mysqlUser || ""
            },
            {
                "name": "MYSQL_DATABASE",
                "value": this.options.mysqlDatabase || ""
            }
        ];

        this.options.timezone && env.push({name: "TZ", value: this.options.timezone});

        let volumes: Volume[] = [];

        !!undefinedIfEmpty(this.options.configurationFiles) && volumes.push({
            name: 'configurations',
            configMap: {name: `${this.fullname}-configuration`}
        });

        !!undefinedIfEmpty(this.options.initializationFiles) && volumes.push({
            name: 'migrations',
            configMap: {name: `${this.fullname}-initialization`}
        })

        this.options.ssl.enabled && volumes.push({name: 'certificates', secret: {secretName: this.options.ssl.secret}});
        volumes.push({"name": "data", "persistentVolumeClaim": {"claimName": `${this.releaseName}-mysql`}});
        this.options.extraVolumes && this.options.extraVolumes.forEach(x => volumes.push(x));

        let initContainers = [
            {
                "command": ["rm", "-fr", "/var/lib/mysql/lost+found"],
                "image": `${this.options.busybox.image}:${this.options.busybox.tag}`,
                "imagePullPolicy": this.options.imagePullPolicy,
                "name": "remove-lost-found",
                "resources": this.options.initContainer.resources,
                volumeMounts: [{
                    mountPath: "/var/lib/mysql",
                    name: "data",
                    subPath: this.options.persistence.subPath
                }]
            }
        ];

        let metricsEnv = [];

        if (!this.options.mysqlAllowEmptyPassword) {
            metricsEnv.push({
                name: 'MYSQL_ROOT_PASSWORD',
                valueFrom: {
                    secretKeyRef: {
                        name: this.options.existingSecret || this.secretName,
                        key: 'mysql-root-password'
                    }
                }
            });
        }


        this.options.extraInitContainers && this.options.extraInitContainers.forEach((x: any) => initContainers.push(x));

        let containers: any[] = [{
            args: undefinedIfEmpty(this.options.args),
            env: env,
            image: `${this.options.image}:${this.options.imageTag}`,
            imagePullPolicy: this.options.imagePullPolicy,
            livenessProbe: {
                exec: {
                    command: liveAndReadinessProbeCommands
                },
                ...this.options.livenessProbe
            },
            name: "release-name-mysql",
            ports: [{"containerPort": 3306, "name": "mysql"}],
            readinessProbe: {
                exec: {
                    command: liveAndReadinessProbeCommands
                },
                ...this.options.readinessProbe
            },
            resources: this.options.resources,
            volumeMounts: volumeMounts
        }];
        if (this.options.metrics.enabled) {
            containers.push({
                image: `${this.options.metrics.image}:${this.options.metrics.imageTag}`,
                imagePullPolicy: this.options.metrics.imagePullPolicy,
                name: 'metrics',
                env: undefinedIfEmpty(metricsEnv),
                command: [
                    "sh",
                    "-c",
                    this.options.mysqlAllowEmptyPassword ? `DATA_SOURCE_NAME="root@(localhost:3306)/" /bin/mysqld_exporter` : `DATA_SOURCE_NAME="root:$MYSQL_ROOT_PASSWORD@(localhost:3306)/" /bin/mysqld_exporter`,
                    ...(this.options.metrics?.flags || [])
                ],
                ports: [{name: 'metrics', containerPort: 9104}],
                livenessProbe: {
                    ...this.options.metrics.livenessProbe,
                    httpGet: {path: '/', port: 'metrics'}
                },
                readinessProbe: {
                    ...this.options.metrics.readinessProbe,
                    httpGet: {path: '/', port: 'metrics'}
                },
                resources: this.options.metrics.resources
            });
        }

        new Deployment(this, 'deployment', {
            metadata: {
                labels: {
                    "app": "release-name-mysql",
                    "release": "release-name"
                },
                annotations: undefinedIfEmpty(this.options.deploymentAnnotations),
                name: "release-name-mysql",
            },
            spec: {
                selector: {"matchLabels": {"app": "release-name-mysql", "release": "release-name"}},
                strategy: {"type": "Recreate"},
                template: {
                    metadata: {
                        labels: {
                            "app": "release-name-mysql",
                            "release": "release-name",
                            ...this.options.podLabels
                        },
                        annotations: undefinedIfEmpty(this.options.podAnnotations)
                    },
                    spec: {
                        containers: containers,
                        imagePullSecrets: undefinedIfEmpty(this.options.imagePullSecrets),
                        initContainers: initContainers,
                        nodeSelector: undefinedIfEmpty(this.options.nodeSelector),
                        priorityClassName: this.options.priorityClassName,
                        schedulerName: this.options.schedulerName,
                        securityContext: this.options.securityContext && this.options.securityContext.enabled ? {
                            fsGroup: this.options.securityContext.fsGroup,
                            runAsUser: this.options.securityContext.runAsUser
                        } : undefined,
                        tolerations: undefinedIfEmpty(this.options.tolerations),
                        serviceAccountName: "default",
                        volumes: volumes,
                        affinity: undefinedIfEmpty(this.options.affinity)
                    }
                }
            }
        });
    }

    private createSecrets() {
        let secretName = this.secretName = `${(this.releaseName)}-mysql`;
        if (this.options.ssl?.enabled && !!this.options.ssl.certificates) {
            for (const cert of this.options.ssl.certificates) {
                new Secret(this, cert.name, {
                    type: 'Opaque',
                    metadata: {
                        name: cert.name,
                        labels: {
                            app: secretName,
                            release: `${(this.releaseName)}`,
                        }
                    },
                    data: {
                        "ca.pem": base64(cert.ca),
                        "server-cert.pem": base64(cert.cert),
                        "server-key.pem": base64(cert.key)
                    }
                });
            }
        }

        if (!this.options.existingSecret && (!this.options.allowEmptyRootPassword || this.options.mysqlRootPassword || this.options.mysqlPassword)) {
            let data: any = {};

            if (this.options.mysqlRootPassword) data["mysql-root-password"] = base64(this.options.mysqlRootPassword);
            else if (!this.options.allowEmptyRootPassword) data["mysql-root-password"] = base64(randAlphaNum(10));

            if (this.options.mysqlPassword) data["mysql-password"] = base64(this.options.mysqlPassword);
            // this is ver-batem copied but I don't like it, seems wrong
            else if (!this.options.allowEmptyRootPassword) data["mysql-password"] = base64(randAlphaNum(10));

            new Secret(this, 'mysql-creds', {
                type: 'Opaque',
                metadata: {
                    name: secretName,
                    labels: {
                        app: secretName,
                        release: this.releaseName,
                    }
                },
                data: data
            });
        }
    }

    private getFullname() {
        if (this.options.fullnameOverride) {
            return this.options.fullnameOverride.substring(0, 63).replace(/-$/, '');
        }
        const defaultName = Node.of(Chart.of(this)).id || this.options.nameOverride;
        return `${defaultName}-mysql`;
    }
}
