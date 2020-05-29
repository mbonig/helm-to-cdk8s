import {Testing} from "cdk8s";
import {MySqlOptions} from "../lib/mysql";
import {byKind, checkVariant, getChart, getYaml, readAndClean} from "./utils";

describe('service', () => {
    let byResourceType = byKind('Service');

    describe('using default values', () => {
        let defaultValues: MySqlOptions = getYaml('src/values.yaml');

        it('matches', () => {
            const chart = getChart(defaultValues);
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
        const options: MySqlOptions = getYaml('src/variant-1.yaml');
        it('exists', () => {
            checkVariant(options, byResourceType, 'test/variant-1.snapshot.yaml');
        });
    });

    describe('using variant-2.yaml', () => {
        const options: MySqlOptions = getYaml('src/variant-2.yaml');
        it('exists', () => {
            checkVariant(options, byResourceType, 'test/variant-2.snapshot.yaml');
        });
    });
});
