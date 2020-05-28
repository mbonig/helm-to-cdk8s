import {App, Chart, Testing} from "cdk8s";
import {MySql, MySqlOptions} from "../lib/mysql";
import {byKind, getYaml, readAndClean} from "./utils";

describe('service account', () => {
    // let mysqlSecret = (x: any) => x.metadata.name !== "mysql-ssl-certs";
    let byResourceType = byKind('ServiceAccount');


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

        it('doesn\'t exist', () => {
            const chart = getChart({...defaultValues});

            const [actualResource] = byResourceType(Testing.synth(chart));
            expect(actualResource).toBeFalsy();

        });
    });

    describe('using variant-1.yaml', () => {
        let hasSecretsValues: MySqlOptions;

        beforeAll(() => {
            hasSecretsValues = getYaml('src/variant-1.yaml');
        });


        it('exists', () => {
            const chart = getChart({
                ...hasSecretsValues
            });

            const [expected] = byResourceType(readAndClean('test/variant-1.snapshot.yaml'));

            const [actualResource] = byResourceType(Testing.synth(chart));
            expect(actualResource).toEqual(expected);
        });
    })

    describe('using variant-2.yaml', () => {
        let hasSecretsValues: MySqlOptions;

        beforeAll(() => {
            hasSecretsValues = getYaml('src/variant-2.yaml');

        });


        it(`exists with given name`, () => {
            // create the chart
            const chart = getChart({
                ...hasSecretsValues
            });
            const [expected] = byResourceType(readAndClean('test/variant-2.snapshot.yaml'));

            // synth the chart
            let actual = Testing.synth(chart);

            // get the actual resource created
            const [actualResource] = byResourceType(actual);

            // check it doesn't exist
            expect(actualResource).toMatchObject(expected);
        });

    });

});
