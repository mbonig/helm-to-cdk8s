import {App, Chart, Testing} from "cdk8s";
import {MySql, MySqlOptions} from "../lib/mysql";
import {byKind, getYaml, readAndClean} from "./utils";

describe('service', () => {
    let byResourceType = byKind('Service');

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

        it('matches', () => {
            const chart = getChart({...defaultValues});
            const [expected] = byResourceType(readAndClean('test/default.snapshot.yaml'));
            // there is a quirk in the helm chart
            // which will render an annotation field even if there are no values
            // and that causes an odd comparisson in the test
            // so instead, let's just delete it
            delete expected.metadata.annotations;
            const [actualResource] = byResourceType(Testing.synth(chart));
            expect(actualResource).toMatchObject(expected);
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
    });

    describe('using variant-2.yaml', () => {
        let hasSecretsValues: MySqlOptions;

        beforeAll(() => {
            hasSecretsValues = getYaml('src/variant-2.yaml');
        });

        it('exists', () => {
            const chart = getChart({
                ...hasSecretsValues
            });

            const [expected] = byResourceType(readAndClean('test/variant-2.snapshot.yaml'));

            const [actualResource] = byResourceType(Testing.synth(chart));
            expect(actualResource).toEqual(expected);
        });
    });
});
