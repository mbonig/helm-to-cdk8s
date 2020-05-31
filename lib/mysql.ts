import {Construct, ConstructOptions, Node} from "constructs";
import {
    ConfigMap,
    Deployment,
    LocalObjectReference,
    PersistentVolumeClaim,
    PodSecurityContext,
    Probe,
    ResourceRequirements,
    Secret,
    Service as S,
    ServiceAccount as SA,
    Volume,
    VolumeMount
} from "../imports/k8s";
import {base64} from "../test/utils";
import {getKeys, randAlphaNum, undefinedIfEmpty} from "./utils";
import {Chart} from "cdk8s";
import {ServiceMonitor as SM} from "../imports/monitoring.coreos.com/servicemonitor";

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

export interface Persistence {
    storageClass: string;
    existingClaim: string;
    enabled: boolean;
    accessMode: string;
    size: string;
    annotations: any;
    subPath?: string;
}

export interface ReadinessLivenessProbe {
    initialDelaySeconds: number;
    timeoutSeconds: number;
}

export interface ServiceMonitor {
    enabled: false;
    additionalLabels: any;
}

export interface Metrics {
    enabled: boolean;
    image: string;
    imageTag: string;
    imagePullPolicy: ImagePullPolicy;
    resources: ResourceRequirements;
    annotations: any;
    livenessProbe: ReadinessLivenessProbe;
    readinessProbe: ReadinessLivenessProbe;
    flags: string[];
    serviceMonitor: ServiceMonitor;
}

export interface Service {
    annotations: any;
    type: string;
    port: number;
    nodePort?: string;
    loadBalancerIP?: string;
}

export interface ServiceAccount {
    name: string;
    create: boolean;
}

export interface Certificate {
    name: string;
    ca: string;
    cert: string;
    key: string;
}

export interface Ssl {
    enabled: boolean;
    secret: string;
    certificates: Certificate[];
}

export interface InitContainer {
    resources: ResourceRequirements
}

export enum ImagePullPolicy {
    'Always' = "Always",
    'Never' = "Never",
    'IfNotPresent' = "IfNotPresent"
}

export interface TestFramework {
    enabled: boolean;
    image: string;
    tag: string;
}

export interface Busybox {
    image: string;
    tag: string;
}

export interface Strategy {
    type: string;
}

export interface PodSecurityContextEnabled extends PodSecurityContext {
    enabled: boolean;
}

export interface MySqlOptions extends ConstructOptions {
    allowEmptyRootPassword: boolean;
    priorityClassName: string;
    nameOverride?: string;
    fullnameOverride?: string;
    schedulerName: string;
    imagePullSecrets?: LocalObjectReference[];
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
    private readonly chart: Node;
    private readonly secretName: string = "";
    private readonly labels: any;
    private readonly serviceAccountName: string;
    private readonly namespace: string;

    constructor(scope: Construct, id: string, private options: MySqlOptions) {
        super(scope, id, options);

        let chart = Chart.of(this);
        this.chart = Node.of(chart);
        this.namespace = chart.namespace || "";

        this.fullname = this.getFullname();
        this.releaseName = this.chart.id;
        this.secretName = `${this.releaseName}-mysql`;
        this.labels = {
            app: this.fullname,
            release: this.releaseName
        };
        this.serviceAccountName = this.getServiceAccountName();

        this.createSecrets();
        this.createDeployment();
        this.createPvc();
        this.createServiceAccount();
        this.createServiceMonitor();
        this.createService();
        this.createConfigMaps();
    }

    private createDeployment() {
        const liveAndReadinessProbeCommands = [
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
        const volumeMounts: VolumeMount[] = [
            {
                mountPath: "/var/lib/mysql",
                name: "data",
                subPath: this.options.persistence.subPath
            }
        ];

        if (undefinedIfEmpty(this.options.configurationFiles)) {
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


        if (this.options.ssl?.enabled) {
            volumeMounts.push({"mountPath": "/ssl", "name": "certificates"});
        }
        if (this.options.extraVolumeMounts) {
            for (const extraVolumeMount of this.options.extraVolumeMounts) {
                // @ts-ignore
                volumeMounts.push(extraVolumeMount);
            }
        }

        const env = [];
        this.options.mysqlAllowEmptyPassword && env.push({
            name: "MYSQL_ALLOW_EMPTY_PASSWORD",
            value: "true"
        });
        !(this.options.allowEmptyRootPassword && !this.options.mysqlRootPassword) && env.push({
            "name": "MYSQL_ROOT_PASSWORD",
            "valueFrom": {
                "secretKeyRef": {
                    "key": "mysql-root-password",
                    "name": this.options.existingSecret || `${this.releaseName}-mysql`,
                    optional: this.options.mysqlAllowEmptyPassword
                }
            }
        });
        env.push(...[
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
        ]);

        if (this.options.timezone) {
            env.push({name: "TZ", value: this.options.timezone});
        }

        const volumes: Volume[] = [];

        if (!!undefinedIfEmpty(this.options.configurationFiles)) {
            volumes.push({
                name: 'configurations',
                configMap: {name: `${this.fullname}-configuration`}
            });
        }

        if (!!undefinedIfEmpty(this.options.initializationFiles)) {
            volumes.push({
                name: 'migrations',
                configMap: {name: `${this.fullname}-initialization`}
            });
        }

        if (this.options.ssl.enabled) {
            volumes.push({name: 'certificates', secret: {secretName: this.options.ssl.secret}});
        }

        let dataVolume: any = {
            "name": "data"
        };
        if (this.options.persistence.enabled) {
            dataVolume.persistentVolumeClaim = {"claimName": this.options.persistence.enabled && this.options.persistence.existingClaim || `${this.releaseName}-mysql`};
        } else {
            dataVolume.emptyDir = {};
        }
        volumes.push(dataVolume);

        if (this.options.extraVolumes) {
            this.options.extraVolumes.forEach(x => volumes.push(x));
        }

        const initContainers = [
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

        const metricsEnv = [];

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

        if (this.options.extraInitContainers) {
            this.options.extraInitContainers.forEach((x: any) => initContainers.push(x));
        }

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
            name: `${this.releaseName}-mysql`,
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
                labels: this.labels,
                annotations: undefinedIfEmpty(this.options.deploymentAnnotations),
                name: `${this.releaseName}-mysql`,
            },
            spec: {
                selector: {"matchLabels": this.labels},
                strategy: {"type": "Recreate"},
                template: {
                    metadata: {
                        labels: {
                            ...this.labels,
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
                        serviceAccountName: this.options.serviceAccount.create ? this.options.serviceAccount.name || this.fullname : "default",
                        volumes: volumes,
                        affinity: undefinedIfEmpty(this.options.affinity)
                    }
                }
            }
        });
    }

    private createSecrets() {
        if (this.options.ssl?.enabled && !!this.options.ssl.certificates) {
            for (const cert of this.options.ssl.certificates) {
                new Secret(this, cert.name, {
                    type: 'Opaque',
                    metadata: {
                        name: cert.name,
                        labels: this.labels
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

            // this is verbatim copy but I don't like it, seems wrong
            else if (!this.options.allowEmptyRootPassword) data["mysql-password"] = base64(randAlphaNum(10));

            new Secret(this, 'mysql-creds', {
                type: 'Opaque',
                metadata: {
                    name: this.secretName,
                    labels: this.labels
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

    private createPvc() {
        if (this.options.persistence.enabled && !this.options.persistence.existingClaim) {
            let storageClassName;
            if (this.options.persistence.storageClass) {
                if (this.options.persistence.storageClass === '-') {
                    storageClassName = "";
                } else {
                    storageClassName = this.options.persistence.storageClass
                }
            }

            new PersistentVolumeClaim(this, 'pvc', {
                metadata: {
                    name: this.fullname,
                    annotations: undefinedIfEmpty(this.options.persistence.annotations),
                    labels: this.labels
                },
                spec: {
                    accessModes: [this.options.persistence.accessMode],
                    resources: {
                        requests: {
                            storage: this.options.persistence.size
                        }
                    },
                    storageClassName: storageClassName
                }
            });
        }
    }

    private createServiceAccount() {
        if (this.options.serviceAccount.create) {
            new SA(this, 'service-account', {
                metadata: {
                    name: this.serviceAccountName,
                    labels: this.labels
                }
            });
        }
    }

    private getServiceAccountName() {
        /*
        {{- define "mysql.serviceAccountName" -}}
        {{- if .Values.serviceAccount.create -}}
        {{ default (include "mysql.fullname" .) .Values.serviceAccount.name }}
        {{- else -}}
        {{ default "default" .Values.serviceAccount.name }}
        {{- end -}}
        {{- end -}}
        */
        if (this.options.serviceAccount.create) {
            return this.options.serviceAccount.name || this.fullname;
        }
        return "";
    }

    private createServiceMonitor() {
        if (this.options.metrics.enabled && this.options.metrics.serviceMonitor.enabled) {
            new SM(this, 'service-monitor', {
                metadata: {
                    name: this.fullname,
                    labels: {
                        ...this.labels,
                        ...this.options.metrics.serviceMonitor.additionalLabels
                    }
                },
                spec: {
                    endpoints: [
                        {port: 'metrics', interval: "30s"}
                    ],
                    namespaceSelector: {
                        matchNames: [this.namespace]
                    },
                    selector: {
                        matchLabels: this.labels
                    }
                }
            });
        }
    }

    private createService() {
        let service = this.options.service;
        let ports: any[] = [
            {
                name: 'mysql',
                port: service.port,
                targetPort: 'mysql',
                nodePort: service.nodePort
            }
        ];
        if (this.options.metrics.enabled) {
            ports.push({
                name: 'metrics',
                port: 9104,
                targetPort: 'metrics'
            });
        }
        let annotations = undefinedIfEmpty({
            ...undefinedIfEmpty(service.annotations),
            ...undefinedIfEmpty(this.options.metrics.enabled && this.options.metrics.annotations ? this.options.metrics.annotations : {})
        });
        new S(this, 'service', {
            metadata: {
                name: this.fullname,
                labels: this.labels,
                annotations: annotations
            },
            spec: {
                type: service.type,
                loadBalancerIP: service.type === "LoadBalancer" && !!service.loadBalancerIP ? service.loadBalancerIP : undefined,
                ports: ports,
                selector: {
                    app: this.fullname
                }
            }
        });
    }

    private createConfigMaps() {
        if (undefinedIfEmpty(this.options.configurationFiles)) {
            new ConfigMap(this, 'config-map-configuration-files', {
                metadata: {
                    name: `${this.fullname}-configuration`
                },
                data: this.options.configurationFiles
            });
        }

        if (undefinedIfEmpty(this.options.initializationFiles)) {
            new ConfigMap(this, 'config-map-initialization-files', {
                metadata: {
                    name: `${this.fullname}-initialization`
                },
                data: this.options.initializationFiles
            });
        }
    }
}
