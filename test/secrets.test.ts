import {App, Chart, Testing} from "cdk8s";
import {MySql, MySqlOptions} from "../lib/mysql";
import {byKind, getYaml, readAndClean, tpl} from "./utils";

describe('secrets', () => {
    let mysqlSecret = (x: any) => x.metadata.name !== "mysql-ssl-certs";

    function getChart(options: MySqlOptions) {
        const app = new App();
        const chart = new Chart(app, 'release-name');
        new MySql(chart, 'release-name', options);
        return chart;
    }


    describe('using default values', () => {
        let defaultValues: MySqlOptions;
        beforeAll(() => {
            defaultValues = getYaml('../src/values.yaml');

            defaultValues.extraVolumes = tpl(defaultValues.extraVolumes);
            defaultValues.extraVolumeMounts = tpl(defaultValues.extraVolumeMounts);
            defaultValues.extraInitContainers = tpl(defaultValues.extraInitContainers);

            console.log(defaultValues);
        });

        it('default - creates mysql root secret', () => {
            const chart = getChart({...defaultValues});

            let expectedSecret: any = byKind.Secret(readAndClean('default.snapshot.yaml'))
                .find(mysqlSecret);

            // since these are randomly generated, we don't want to check for them.
            delete expectedSecret.data["mysql-password"];
            delete expectedSecret.data["mysql-root-password"];

            let actual = Testing.synth(chart);
            const actualResource = byKind.Secret(actual).find(mysqlSecret);
            expect(actualResource).toMatchObject(expectedSecret);

            // this could be done better. Since I delete the fields off the expected
            // object then the test here is 'don't even check if the fields exist'
            // which isn't great and I think could be replaced with a routine
            // that would decode the value and check to see it's sufficiently
            // random
        });
    });

    describe('using override-all.yaml', () => {
        let hasSecretsValues: MySqlOptions;

        beforeAll(() => {
            hasSecretsValues = getYaml('../src/override-all.yaml');

            hasSecretsValues.extraVolumes = tpl(hasSecretsValues.extraVolumes);
            hasSecretsValues.extraVolumeMounts = tpl(hasSecretsValues.extraVolumeMounts);
            hasSecretsValues.extraInitContainers = tpl(hasSecretsValues.extraInitContainers);
        });


        it('has secrets for certs', () => {
            const chart = getChart({
                ...hasSecretsValues
            });

            const expected = byKind.Secret(readAndClean('override-all.snapshot.yaml'));
            let mysqlSslCertSecret = (x: any) => x.metadata.name === "mysql-ssl-certs";
            const expectedResource = expected.find(mysqlSslCertSecret);

            let actual = Testing.synth(chart);
            const actualResource = actual.find(x => x.kind === "Secret");
            expect(actualResource).toEqual(expectedResource);
        });

        it('uses provided passwords in secret', () => {
            // create the chart
            const chart = getChart({
                ...hasSecretsValues
            });

            // get the resource from the snapshot we want
            let expectedResource: any = byKind.Secret(readAndClean('override-all.snapshot.yaml'))
                .find(mysqlSecret);

            // synth the chart
            let actual = Testing.synth(chart);

            // get the actual resource created
            const actualResource = byKind.Secret(actual).find(mysqlSecret);

            // check for toMatchObject (not a complete deep-equals)
            expect(actualResource).toMatchObject(expectedResource);
        });

    });
});
