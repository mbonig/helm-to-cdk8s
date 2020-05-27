import {App, Chart, Testing} from "cdk8s";
import {MySql, MySqlOptions} from "../lib/mysql";
import {byKind, getYaml, readAndClean, tpl} from "./utils";
import {Secret} from "../imports/k8s";

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

    describe('using variant-1.yaml', () => {
        let hasSecretsValues: MySqlOptions;

        beforeAll(() => {
            hasSecretsValues = getYaml('../src/variant-1.yaml');

            hasSecretsValues.extraVolumes = tpl(hasSecretsValues.extraVolumes);
            hasSecretsValues.extraVolumeMounts = tpl(hasSecretsValues.extraVolumeMounts);
            hasSecretsValues.extraInitContainers = tpl(hasSecretsValues.extraInitContainers);
        });


        it('has secrets for certs', () => {
            const chart = getChart({
                ...hasSecretsValues
            });

            const expected = byKind.Secret(readAndClean('variant-1.snapshot.yaml'));
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
            let expectedResource: any = byKind.Secret(readAndClean('variant-1.snapshot.yaml'))
                .find(mysqlSecret);

            // synth the chart
            let actual = Testing.synth(chart);

            // get the actual resource created
            const actualResource = byKind.Secret(actual).find(mysqlSecret);

            // check for toMatchObject (not a complete deep-equals)
            expect(actualResource).toMatchObject(expectedResource);
        });

    })

    describe('using variant-2.yaml', () => {
        let hasSecretsValues: MySqlOptions;

        beforeAll(() => {
            hasSecretsValues = getYaml('../src/variant-2.yaml');

            hasSecretsValues.extraVolumes = tpl(hasSecretsValues.extraVolumes);
            hasSecretsValues.extraVolumeMounts = tpl(hasSecretsValues.extraVolumeMounts);
            hasSecretsValues.extraInitContainers = tpl(hasSecretsValues.extraInitContainers);
        });


        it(`secret isn't created`, () => {
            // create the chart
            const chart = getChart({
                ...hasSecretsValues
            });

            // synth the chart
            let actual = Testing.synth(chart);

            // get the actual resource created
            const actualResource = byKind.Secret(actual).find(mysqlSecret);

            // check it doesn't exist
            expect(actualResource).toBeFalsy();
        });

    });

    describe('using variant-3.yaml', () => {
        let hasSecretsValues: MySqlOptions;

        beforeAll(() => {
            hasSecretsValues = getYaml('../src/variant-3.yaml');

            hasSecretsValues.extraVolumes = tpl(hasSecretsValues.extraVolumes);
            hasSecretsValues.extraVolumeMounts = tpl(hasSecretsValues.extraVolumeMounts);
            hasSecretsValues.extraInitContainers = tpl(hasSecretsValues.extraInitContainers);
        });


        it(`secret has blank passwords`, () => {
            // create the chart
            const chart = getChart({
                ...hasSecretsValues
            });

            // get the resource from the snapshot we want
            let expectedResource: any = byKind.Secret(readAndClean('variant-3.snapshot.yaml'))
                .find(mysqlSecret);


            // synth the chart
            let actual = Testing.synth(chart);

            // get the actual resource created
            const actualResource: Secret = byKind.Secret(actual).find(mysqlSecret) as any;

            // @ts-ignore
            expect(actualResource?.data["mysql-root-password"]).toBeUndefined();
            expect(actualResource).toMatchObject(expectedResource);
        });

    });
});
