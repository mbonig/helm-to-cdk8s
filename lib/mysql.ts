import {Construct, ConstructOptions, Node} from "constructs";
import {Deployment, PodSecurityContext, Probe, ResourceRequirements, Secret} from "../imports/k8s";
import {base64} from "../test/utils";
import {randAlphaNum} from "./utils";
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
    enabled: true;
    accessMode: 'ReadWriteOnce';
    size: '8Gi';
    annotations: {};
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

export interface MySqlOptions extends ConstructOptions {
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
    securityContext: PodSecurityContext;
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
    private releaseName: string;
    // @ts-ignore
    private chart: Node;

    constructor(scope: Construct, id: string, private options: MySqlOptions) {
        super(scope, id, options);
        this.chart = Node.of(Chart.of(this));
        this.releaseName = this.chart.id;
        this.createSecrets();
        this.createDeployment();
    }

    private createDeployment() {
        let liveAndReadinessProbeCommands = [
            ...(this.options.mysqlAllowEmptyPassword ? ['mysqladmin', 'ping'] : []),
            'sh',
            '-c',
            "mysqladmin ping -u root -p${MYSQL_ROOT_PASSWORD}"
        ];
        let volumeMounts = [{"mountPath": "/var/lib/mysql", "name": "data"}];
        if (this.options.ssl?.enabled) volumeMounts.push({"mountPath": "/ssl", "name": "certificates"});
        if (this.options.extraVolumeMounts) {
            for (const extraVolumeMount of this.options.extraVolumeMounts) {
                // @ts-ignore
                volumeMounts.push(extraVolumeMount);
            }
        }

        let env = [
            {
                "name": "MYSQL_ROOT_PASSWORD",
                "valueFrom": {
                    "secretKeyRef": {
                        "key": "mysql-root-password",
                        "name": `${this.releaseName}-mysql`
                    }
                }
            },
            {
                "name": "MYSQL_PASSWORD",
                "valueFrom": {
                    "secretKeyRef": {
                        "key": "mysql-password",
                        "name": `${this.releaseName}-mysql`,
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

        let volumes: ({ name: string; persistentVolumeClaim: { claimName: string } } | ExtraVolume)[] = [];

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
                "volumeMounts": [{"mountPath": "/var/lib/mysql", "name": "data"}]
            }
        ];

        this.options.extraInitContainers && this.options.extraInitContainers.forEach((x: any) => initContainers.push(x));

        new Deployment(this, 'deployment', {
            metadata: {
                labels: {
                    "app": "release-name-mysql",
                    "release": "release-name"
                },
                annotations: this.options.deploymentAnnotations,
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
                        annotations: this.options.podAnnotations
                    },
                    spec: {
                        containers: [{
                            args: this.options.args,
                            env: env,
                            "image": `${this.options.image}:${this.options.imageTag}`,
                            "imagePullPolicy": this.options.imagePullPolicy,
                            "livenessProbe": {
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
                        }],
                        initContainers: initContainers,
                        serviceAccountName: "default",
                        volumes: volumes
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
                        labels: {
                            app: `${(this.releaseName)}-mysql`,
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

        if (!this.options.existingSecret) {
            new Secret(this, 'mysql-creds', {
                type: 'Opaque',
                metadata: {
                    name: `${(this.releaseName)}-mysql`,
                    labels: {
                        app: `${(this.releaseName)}-mysql`,
                        release: this.releaseName,
                    }
                },
                data: {
                    "mysql-root-password": base64(this.options.mysqlRootPassword || randAlphaNum(10)),
                    "mysql-password": base64(this.options.mysqlPassword || randAlphaNum(10))
                }
            });
        }
    }
}
