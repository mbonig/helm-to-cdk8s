import {Construct} from 'constructs';
import {App, Chart} from 'cdk8s';
import {getYaml} from "./test/utils";
import {MySql} from "./lib/mysql";

class MyChart extends Chart {
    constructor(scope: Construct, name: string) {
        super(scope, name);

        // define resources here
        const values = getYaml('src/variant-1.yaml');
        new MySql(this, 'mysql', values);
    }
}

const app = new App();
new MyChart(app, 'cdk8s-migration');
app.synth();
