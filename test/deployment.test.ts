import {App, Chart, Testing} from "cdk8s";
import {MySql, MySqlOptions} from "../lib/mysql";
import {byKind, getYaml, readAndClean, tpl} from "./utils";


describe('deployment', () => {
    let defaultValues: MySqlOptions;
    beforeAll(() => {
        defaultValues = getYaml('../src/values.yaml');

        defaultValues.extraVolumes = tpl(defaultValues.extraVolumes);
        defaultValues.extraVolumeMounts = tpl(defaultValues.extraVolumeMounts);
        defaultValues.extraInitContainers = tpl(defaultValues.extraInitContainers);

        console.log(defaultValues);
    });

    function getChart(options: MySqlOptions = defaultValues) {
        const app = new App();

        const chart = new Chart(app, 'release-name');
        new MySql(chart, 'mysql', options);
        return chart;
    }

    it('deployment default values', () => {
        const chart = getChart({
            ...defaultValues,
        });

        const deployment = byKind.Deployment(readAndClean('default.snapshot.yaml'))[0];
        let actual = Testing.synth(chart);
        const actualDeployment = byKind.Deployment(actual)[0];
        expect(actualDeployment).toEqual(deployment);
    });

    it('sets up liveness probe commands if empty passwords are allowed', () => {

    });

    it('additional args are passed to the MySQL container', () => {
        const overrideAll = getYaml('../src/override-all.yaml');

        // overrideAll has some tpl using text, like:
        // extraVolumeMounts: |
        //   - name: extras
        //     mountPath: /usr/share/extras
        //     readOnly: true
        // which needs special handling:
        overrideAll.extraVolumes = tpl(overrideAll.extraVolumes);
        overrideAll.extraVolumeMounts = tpl(overrideAll.extraVolumeMounts);
        overrideAll.extraInitContainers = tpl(overrideAll.extraInitContainers);

        const chart = getChart({
            ...overrideAll
        });
        const deployment = byKind.Deployment(readAndClean('override-all.snapshot.yaml'))[0];
        let actual = Testing.synth(chart);
        const actualDeployment = byKind.Deployment(actual)[0];
        expect(actualDeployment).toEqual(deployment);
    });

    it('tests persistence subpath',()=>{});
    it('env variables with allow empty', ()=>{
        /*
        env:
        {{- if .Values.mysqlAllowEmptyPassword }}
        - name: MYSQL_ALLOW_EMPTY_PASSWORD
          value: "true"
        {{- end }}
        {{- if not (and .Values.allowEmptyRootPassword (not .Values.mysqlRootPassword)) }}
        - name: MYSQL_ROOT_PASSWORD
          valueFrom:
            secretKeyRef:
              name: {{ template "mysql.secretName" . }}
              key: mysql-root-password
              {{- if .Values.mysqlAllowEmptyPassword }}
              optional: true
              {{- end }}
        {{- end }}
        {{- if not (and .Values.allowEmptyRootPassword (not .Values.mysqlPassword)) }}
        - name: MYSQL_PASSWORD
          valueFrom:
            secretKeyRef:
              name: {{ template "mysql.secretName" . }}
              key: mysql-password
              {{- if or .Values.mysqlAllowEmptyPassword (empty .Values.mysqlUser) }}
              optional: true
              {{- end }}
        {{- end }}
        - name: MYSQL_USER
          value: {{ default "" .Values.mysqlUser | quote }}
        - name: MYSQL_DATABASE
          value: {{ default "" .Values.mysqlDatabase | quote }}
        * */
    });
})
