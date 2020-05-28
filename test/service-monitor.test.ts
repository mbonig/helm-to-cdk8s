import {App, Chart, Testing} from "cdk8s";
import {MySql, MySqlOptions} from "../lib/mysql";
import {byKind, getYaml, readAndClean} from "./utils";

describe('service monitor', () => {
    let byResourceType = byKind('ServiceMonitor');

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
            hasSecretsValues = getYaml('../src/variant-1.yaml');
        });

        it('exists', () => {
            const chart = getChart({
                ...hasSecretsValues
            });

            const [expected] = byResourceType(readAndClean('variant-1.snapshot.yaml'));

            const [actualResource] = byResourceType(Testing.synth(chart));
            expect(actualResource).toEqual(expected);
        });
    });
});
