import {Construct} from 'constructs';
import {App, Chart} from 'cdk8s';
import {MySql, MySqlOptions} from "./lib/mysql";
import {getNamespace, getReleaseName, getValues} from "./lib/utils";

interface MySqlChartOptions {
    values: MySqlOptions;
    namespace?: string;
}

class MySqlChart extends Chart {
    constructor(scope: Construct, name: string, {values, namespace}: MySqlChartOptions) {
        super(scope, name, {namespace});
        new MySql(this, 'mysql', values);
    }
}

const app = new App();
const values = getValues();
let releaseName = getReleaseName() ;
let namespace = getNamespace();

new MySqlChart(app, releaseName, {values, namespace});
app.synth();
