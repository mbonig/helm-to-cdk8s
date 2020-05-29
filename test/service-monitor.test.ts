import {Testing} from "cdk8s";
import {MySqlOptions} from "../lib/mysql";
import {byKind, checkVariant, getChart, getYaml, readAndClean} from "./utils";

describe('service monitor', () => {
    let byResourceType = byKind('ServiceMonitor');

    describe('using default values', () => {
        let defaultValues: MySqlOptions = getYaml('src/values.yaml');

        it('doesn\'t exist', () => {
            checkVariant(defaultValues, byResourceType);
        });
    });

    describe('using variant-1.yaml', () => {
        let hasSecretsValues: MySqlOptions = getYaml('src/variant-1.yaml');
        it('exists', () => {
            const chart = getChart(hasSecretsValues, {namespace: 'test'});
            const [expected] = byResourceType(readAndClean('test/variant-1.snapshot.yaml'));
            expected.metadata.namespace = "test";

            const [actualResource] = byResourceType(Testing.synth(chart));
            expect(actualResource).toEqual(expected);
        });
    });
});
