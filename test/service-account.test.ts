import {MySqlOptions} from "../lib/mysql";
import {byKind, checkVariant, getYaml} from "./utils";

describe('service account', () => {
    let byResourceType = byKind('ServiceAccount');

    describe('using default values', () => {
        const defaultValues: MySqlOptions = getYaml('src/values.yaml');
        it('doesn\'t exist', () => {
            checkVariant(defaultValues, byResourceType);
        });
    });

    describe('using variant-1.yaml', () => {
        const options: MySqlOptions = getYaml('src/variant-1.yaml');
        it('exists', () => {
            checkVariant(options, byResourceType, 'test/variant-1.snapshot.yaml');
        });
    })

    describe('using variant-2.yaml', () => {
        const options: MySqlOptions = getYaml('src/variant-2.yaml');
        it(`exists with given name`, () => {
            checkVariant(options, byResourceType, 'test/variant-2.snapshot.yaml');
        });
    });
});
