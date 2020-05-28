* run the default values file and produce a resulting templates, saved as 'default.snapshot.yaml' in the tests, also save off the values.yaml into the local directory

divide test files by resource type

* multiple tests for each `values` file defined previously, the variants

---
Review the existing chart's README and templates
Divide and conquer approach:
Divide by resource type
Determine test for each resource type
determine number of snapshots you'll need
generate the snapshots

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

look for any templates, create helper methods for those and tests around them specifically.
 
  
Get variants:

Start with deployment.yaml (or whatever)
get all usages of .Values. (use script)
go line by line through template. For each reference (straight reference or if statement), check if it's provided in the default file.
If it's in the default file, mark that on your sheet
If it's not, then mark it as variant-1
If it's an if statement... ?? 

  
