import {MySqlOptions} from "../lib/mysql";
import {byKind, checkVariant, getYaml} from "./utils";


describe('deployment', () => {
    let byResourceType = byKind.Deployment;

    it('default values', () => {
        const defaultValues = getYaml('src/values.yaml');
        checkVariant(defaultValues, byResourceType);
    });

    it('variant-1', () => {
        const options = getYaml('src/variant-1.yaml');
        checkVariant(options, byResourceType, 'test/variant-1.snapshot.yaml');
    });

    it('variant-2', () => {
        const options = getYaml('src/variant-2.yaml');
        checkVariant(options, byResourceType, 'test/variant-2.snapshot.yaml');
    });

    it('variant-3', () => {
        const options = getYaml('src/variant-3.yaml');
        checkVariant(options, byResourceType, 'test/variant-3.snapshot.yaml');
    });

    it('variant-4', () => {
        let options: MySqlOptions = getYaml('src/variant-4.yaml');
        checkVariant(options, byResourceType, 'test/variant-4.snapshot.yaml');
    });
})
