import {MySql, MySqlOptions} from "../lib/mysql";
import {byKind, getYaml} from "./utils";
import {App, Chart, Testing} from "cdk8s";

describe('templates', () => {
    let byResourceType = byKind('ServiceAccount');

    describe('fullname', () => {
        const options: MySqlOptions = getYaml('src/variant-1.yaml');

        it('uses override', () => {
            const app = new App();
            const chart = new Chart(app, 'release-name');
            let fullnameOverride = 'fullnameoverride';
            new MySql(chart, 'release-name', {...options, fullnameOverride});

            const [actual] = byResourceType(Testing.synth(chart));
            expect(actual.metadata.labels.app).toBe(fullnameOverride)
        });
    });
});
