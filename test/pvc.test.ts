import {MySqlOptions} from "../lib/mysql";
import {byKind, checkVariant, getYaml} from "./utils";

describe('pvc', () => {
    let byResourceType = byKind('PersistentVolumeClaim');

    describe('using default values', () => {
        const options: MySqlOptions = getYaml('src/values.yaml');
        it('default', () => {
            checkVariant(options, byResourceType, 'test/default.snapshot.yaml');
        });
    });

    describe('using variant-1.yaml', () => {
        let options: MySqlOptions = getYaml('src/variant-1.yaml');
        it('has single pvc', () => {
            checkVariant(options, byResourceType, 'test/variant-1.snapshot.yaml');
        });
    })

    describe('using variant-2.yaml', () => {
        let options: MySqlOptions = getYaml('src/variant-2.yaml');
        it(`pvc not created`, () => {
            checkVariant(options, byResourceType, 'test/variant-2.snapshot.yaml');
        });
    });
});
