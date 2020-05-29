import {MySqlOptions} from "../lib/mysql";
import {byKind, checkVariant, getYaml} from "./utils";

describe('config maps', () => {
    let byResourceType = byKind('ConfigMap');

    let mySqlConfiguration = (x: { metadata: { name: string; }; }) => x.metadata.name === "release-name-mysql-configuration";
    let mySqlInitialization = (x: { metadata: { name: string; }; }) => x.metadata.name === "release-name-mysql-initialization";

    describe('using default values', () => {
        let defaultValues: MySqlOptions = getYaml('src/values.yaml');
        it('does not create any', () => {
            checkVariant(defaultValues, byResourceType, 'test/default.snapshot.yaml', mySqlConfiguration);
        });
    });

    describe('using variant-1.yaml', () => {
        let options: MySqlOptions = getYaml('src/variant-1.yaml');

        it('has config cm', () => {
            checkVariant(options, byResourceType, 'test/variant-1.snapshot.yaml', mySqlConfiguration)
        });

        it('has init cm', () => {
            checkVariant(options, byResourceType, 'test/variant-1.snapshot.yaml', mySqlInitialization)
        });
    });
});
