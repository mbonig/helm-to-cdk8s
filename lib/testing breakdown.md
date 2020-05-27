|Resource|Aspect|Sample|Property
|---|---|---|---
|Deployment|name is templated correctly: [src/templates/_helpers.tpl:14]()|default|
|Deployment|labels are set properly: [src/templates/deployment.yaml:6]()|default
|Deployment|deploymentAnnotations is passed through [src/templates/deployment.yaml:11]()|variant-1
|Deployment|strategy is passed through [src/templates/deployment.yaml:18]()|default
|Deployment|spec.selector.matchlabels [src/templates/deployment.yaml:20]()|default
|Deployment|spec.template.metadata.labels [src/templates/deployment.yaml:26]()|default
|Deployment|spec.template.metadata.labels with podLabels [src/templates/deployment.yaml:28]()|variant-1
|Deployment|spec.template.metadata.annotations passthrough [src/templates/deployment.yaml:31]()|variant-1
|Deployment|spec.template.spec.schedulerName [src/templates/deployment.yaml:36]()|variant-1
|Deployment|spec.template.spec.imagePullSecrets [src/templates/deployment.yaml:40]()|variant-1
|Deployment|spec.template.spec.priorityClassName [src/templates/deployment.yaml:44]()|variant-1
|Deployment|spec.template.spec.securityContext [src/templates/deployment.yaml:46]()|variant-1
|Deployment|serviceAccountName [src/templates/deployment.yaml:51]()|default
|Deployment|initContainers[0].image [src/templates/deployment.yaml:54]()|default
|Deployment|imagePullPolicy [src/templates/deployment.yaml:55]()|default
|Deployment|initContainer[0].resources [src/templates/deployment.yaml:57]()|default
|Deployment|volumeMounts[0].subPath [src/templates/deployment.yaml:61]()|variant-1
|Deployment|extraInitContainers [src/templates/deployment.yaml:66]()|variant-1
|Deployment|nodeSelector [src/templates/deployment.yaml:68]()|variant-1
|Deployment|affinity [src/templates/deployment.yaml:73]()|variant-1
|Deployment|tolerations [src/templates/deployment.yaml:77]()|variant-1
|Deployment|containers[0].name [src/templates/deployment.yaml:81]()|default
|Deployment|containers[0].args [src/templates/deployment.yaml:86]()|variant-1
|Deployment|containers[0].resources [src/templates/deployment.yaml:91]()|default
|Deployment|containers[0].env MYSQL_ALLOW_EMPTY_PASSWORD [src/templates/deployment.yaml:93]()|variant-2
|Deployment|containers[0].env MYSQL_ROOT_PASSWORD [src/templates/deployment.yaml:99]()|variant-1
|Deployment|containers[0].env MYSQL_USER [src/templates/deployment.yaml:99]()|variant-1
|Deployment|containers[0].env MYSQL_DATABASE [src/templates/deployment.yaml:99]()|variant-1
|Deployment|containers[0].env TZ [src/templates/deployment.yaml:99]()|variant-1
|Deployment|livenessProbe [src/templates/deployment.yaml:132]() |variant-1/variant-2
|Deployment|readinessProbe [src/templates/deployment.yaml:132]() |variant-1/variant-2
|Deployment|volumeMounts[0].subPath [src/templates/deployment.yaml:165]()|variant-1
|Deployment|configurationFiles [src/templates/deployment.yaml:167]()|variant-1
|Deployment|initializationFiles [src/templates/deployment.yaml:174]()|variant-1
|Deployment|ssl mount [src/templates/deployment.yaml:178]()|variant-1
|Deployment|extraVolumeMounts [src/templates/deployment.yaml:183]()|variant-1
|Deployment|metrics [src/templates/deployment.yaml:185]()|variant-1
|Deployment|metric resources [src/templates/deployment.yaml:225]()|variant-1
|Deployment|configuration volumes [src/templates/deployment.yaml:228]()|variant-1
|Deployment|extra volumes [src/templates/deployment.yaml:251]()|variant-1
|---|---|---
|ConfigMap|configurationfiles [src/templates/configurationFiles-configmap.yaml:1]()|variant-1
|ConfigMap|initialization files [src/templates/initializationFiles-configmap.yaml:1]()|variant-1
|---|---|---
|PersistentVolumeClaim|pvc created [src/templates/pvc.yaml:1]()|default
|PersistentVolumeClaim|annotations [src/templates/pvc.yaml:7]()|variant-1
|PersistentVolumeClaim|storageClass [src/templates/pvc.yaml:22]()|variant-1
|---|---|---
|Secret|is created [src/templates/secrets.yaml:1]() |default
|Secret|is not created [src/templates/secrets.yaml:1]() |variant-2/variant-1
|Secret|provided passwords [src/templates/secrets.yaml:16]() | variant-1
|Secret|provided passwords [src/templates/secrets.yaml:18]() | variant-2
|Secret|provided passwords [src/templates/secrets.yaml:22]() | variant-1
|Secret|ssl cert [src/templates/secrets.yaml:30] | variant-1
|---|---|---
|ServiceAccount|created [src/templates/serviceaccount.yaml:1] | variant-1
|---|---|---
|ServiceMonitor|created [src/templates/servicemonitor.yaml:1] | variant-1
|---|---|---
|Service|created [src/templates/svc.yaml:1]|default
|Service|annotations [src/templates/svc.yaml:12]|variant-1
|Service|metrics annotations [src/templates/svc.yaml:12]|variant-1
|Service|loadbalancer type [src/templates/svc.yaml:21]|variant-1
|Service|nodePort type [src/templates/svc.yaml:27]|variant-1



