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
        it(`pvc not created because existing claim is provided`, () => {
            checkVariant(options, byResourceType, 'test/variant-2.snapshot.yaml');
        });
    });

    describe('using variant-3.yaml', () => {
        let options: MySqlOptions = getYaml('src/variant-3.yaml');
        it(`pvc created with storage class`, () => {
            checkVariant(options, byResourceType, 'test/variant-3.snapshot.yaml');
        });
    });
    describe('using variant-4.yaml', () => {
        let options: MySqlOptions = getYaml('src/variant-4.yaml');
        it(`pvc not created becaues persistence is disabled`, () => {
            checkVariant(options, byResourceType, 'test/variant-4.snapshot.yaml');
        });
    });
});
