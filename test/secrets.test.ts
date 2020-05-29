import {Testing} from "cdk8s";
import {MySqlOptions} from "../lib/mysql";
import {byKind, checkVariant, getChart, getYaml, readAndClean} from "./utils";
import {Secret} from "../imports/k8s";

describe('secrets', () => {
    const byResourceType = byKind.Secret;
    const mysqlSecretPredicate = (x: any) => x.metadata.name !== "mysql-ssl-certs";
    const certPredicate = (x: any) => x.metadata.name === "mysql-ssl-certs";

    describe('using default values', () => {
        const defaultValues = getYaml('src/values.yaml');

        it('default - creates mysql root secret', () => {
            const chart = getChart({...defaultValues});

            let expectedSecret: any = byResourceType(readAndClean('test/default.snapshot.yaml'))
                .find(mysqlSecretPredicate);

            // since these are randomly generated, we don't want to check for them.
            delete expectedSecret.data["mysql-password"];
            delete expectedSecret.data["mysql-root-password"];

            let actual = Testing.synth(chart);
            const actualResource = byKind.Secret(actual).find(mysqlSecretPredicate);
            expect(actualResource).toMatchObject(expectedSecret);
        });
    });

    describe('using variant-1.yaml', () => {
        let options: MySqlOptions = getYaml('src/variant-1.yaml')

        it('has secrets for certs', () => {
            checkVariant(options, byResourceType, 'test/variant-1.snapshot.yaml', certPredicate);
        });

        it('uses provided passwords in secret', () => {
            checkVariant(options, byResourceType, 'test/variant-1.snapshot.yaml', mysqlSecretPredicate);
        });

    })

    describe('using variant-2.yaml', () => {
        let options: MySqlOptions = getYaml('src/variant-2.yaml');

        it(`secret isn't created`, () => {
            checkVariant(options, byResourceType, 'test/variant-2.snapshot.yaml', mysqlSecretPredicate)
        });

    });

    describe('using variant-3.yaml', () => {
        let options: MySqlOptions = getYaml('src/variant-3.yaml');

        it(`secret has blank passwords`, () => {
            // create the chart
            const chart = getChart(options);

            // get the resource from the snapshot we want
            let expectedResource: any = byKind.Secret(readAndClean('test/variant-3.snapshot.yaml'))
                .find(mysqlSecretPredicate);


            // synth the chart
            let actual = Testing.synth(chart);

            // get the actual resource created
            const actualResource: Secret = byKind.Secret(actual).find(mysqlSecretPredicate) as any;

            // @ts-ignore
            expect(actualResource?.data["mysql-root-password"]).toBeUndefined();
            expect(actualResource).toMatchObject(expectedResource);
        });

    });
});
