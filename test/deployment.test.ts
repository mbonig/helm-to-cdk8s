import {App, Chart, Testing} from "cdk8s";
import {MySql, MySqlOptions} from "../lib/mysql";
import {byKind, getYaml, readAndClean} from "./utils";


describe('deployment', () => {
    let defaultValues: MySqlOptions;

    function getChart(options: MySqlOptions = defaultValues) {
        const app = new App();

        const chart = new Chart(app, 'release-name');
        new MySql(chart, 'mysql', options);
        return chart;
    }

    it('default values', () => {
        const defaultValues = getYaml('../src/values.yaml');


        const chart = getChart({
            ...defaultValues,
        });

        const deployment = byKind.Deployment(readAndClean('default.snapshot.yaml'))[0];
        let actual = Testing.synth(chart);
        const actualDeployment = byKind.Deployment(actual)[0];
        expect(actualDeployment).toEqual(deployment);
    });

    it('variant-1', () => {
        const overrideAll = getYaml('../src/variant-1.yaml');


        const chart = getChart({
            ...overrideAll
        });
        const deployment = byKind.Deployment(readAndClean('variant-1.snapshot.yaml'))[0];
        let actual = Testing.synth(chart);
        const actualDeployment = byKind.Deployment(actual)[0];
        expect(actualDeployment).toEqual(deployment);
    });

    it('variant-2', () => {
        const values = getYaml('../src/variant-2.yaml');
        const chart = getChart({
            ...values
        });
        const deployment = byKind.Deployment(readAndClean('variant-2.snapshot.yaml'))[0];
        let actual = Testing.synth(chart);
        const actualDeployment = byKind.Deployment(actual)[0];
        expect(actualDeployment).toEqual(deployment);

    });

    it('variant-3', () => {
        const values = getYaml('../src/variant-3.yaml');

        const chart = getChart({
            ...values
        });
        const deployment = byKind.Deployment(readAndClean('variant-3.snapshot.yaml'))[0];
        let actual = Testing.synth(chart);
        const actualDeployment = byKind.Deployment(actual)[0];
        expect(actualDeployment).toEqual(deployment);

    });
})
