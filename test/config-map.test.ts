import {App, Chart, Testing} from "cdk8s";
import {MySql, MySqlOptions} from "../lib/mysql";
import {byKind, getYaml, readAndClean} from "./utils";

describe('config maps', () => {
    // let mysqlSecret = (x: any) => x.metadata.name !== "mysql-ssl-certs";
    let byResourceType = byKind('ConfigMap');

    // @ts-ignore
    let mySqlConfiguration = x => x.metadata.name === "release-name-mysql-configuration";
    // @ts-ignore
    let mySqlInitialization = x => x.metadata.name === "release-name-mysql-initialization";

    function getChart(options: MySqlOptions) {
        const app = new App();
        const chart = new Chart(app, 'release-name');
        new MySql(chart, 'release-name', options);
        return chart;
    }

    describe('using default values', () => {
        let defaultValues: MySqlOptions;
        beforeAll(() => {
            defaultValues = getYaml('src/values.yaml');
        });

        it('does not create any', () => {
            const chart = getChart({...defaultValues});
            const [actualResource] = byResourceType(Testing.synth(chart));
            expect(actualResource).toBeFalsy;
        });
    });

    describe('using variant-1.yaml', () => {
        let hasSecretsValues: MySqlOptions;

        beforeAll(() => {
            hasSecretsValues = getYaml('src/variant-1.yaml');
        });


        it('has config cm', () => {
            const chart = getChart({
                ...hasSecretsValues
            });

            const expected = byResourceType(readAndClean('test/variant-1.snapshot.yaml')).find(mySqlConfiguration);
            const [actualResource] = byResourceType(Testing.synth(chart));
            expect(actualResource).toEqual(expected);
        });

        it('has init cm', () => {
            const chart = getChart({
                ...hasSecretsValues
            });

            const expected = byResourceType(readAndClean('test/variant-1.snapshot.yaml')).find(mySqlInitialization);
            const actualResource = byResourceType(Testing.synth(chart)).find(mySqlInitialization);
            expect(actualResource).toEqual(expected);
        });
    })

    /*
        describe('using variant-2.yaml', () => {
            let hasSecretsValues: MySqlOptions;

            beforeAll(() => {
                hasSecretsValues = getYaml('src/variant-2.yaml');

            });


            it(`pvc not created`, () => {
                // create the chart
                const chart = getChart({
                    ...hasSecretsValues
                });

                // synth the chart
                let actual = Testing.synth(chart);

                // get the actual resource created
                const [actualResource] = byResourceType(actual);

                // check it doesn't exist
                expect(actualResource).toBeFalsy();
            });

        });
    */

});
