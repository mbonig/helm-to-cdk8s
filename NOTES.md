



* run the default values file and produce a resulting templates, saved as 'default.snapshot.yaml' in the tests, also save off the values.yaml into the local directory

* write tests to do a full "equals" match
    * problem with this is that there are some helm-specific parts of the template that probably shouldn't come over
    * need to determine a way to do partial tests
* need to analyze existing helm chart:
    * determine values files to use
        * the default
        * an 'all-in'?
        * as many as needed to cover functionality
        * many different ifs could be represented

divide test files by resource type
* multiple tests for each `values` file defined previously

existing helm convention: release-name, that's the chart's name


---
Review the existing chart's README and templates
Divide and conquer approach:
Divide by resource type
Determine test for each resource type
determine number of snapshots you'll need
generate the snapshots
fill in the tests.

get all Values used:
```
cat deployment.yaml| grep -iEo '.Values.([a-z0-9_.]*)'
```

Kinds of code worth reviewing:
* ```
  name: {{ template "mysql.fullname" . }}
  namespace: {{ .Release.Namespace }}
  // basic reference  
  ```
* ```
  {{- with .Values.deploymentAnnotations }}
    annotations:
  {{ toYaml . | indent 4 }}
  // passthrough yaml
  ```
* ```
  {{- if .Values.schedulerName }}
    schedulerName: "{{ .Values.schedulerName }}"
  {{- end }}
  // a safety/empty check      
  ```
* ```
  {{- if not (and .Values.allowEmptyRootPassword (not .Values.mysqlRootPassword)) }}
  - name: MYSQL_ROOT_PASSWORD
  // more complicated if logic        
  ```
  
  
