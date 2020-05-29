import {App, Chart, ChartOptions, Testing, Yaml} from "cdk8s";
import * as jsyaml from 'js-yaml';
import {MySql, MySqlOptions} from "../lib/mysql";

export function getYaml(path: string): any | any[] {
    const results = Yaml.load(path);
    let filtered = results
        .filter(x => !!x)
        .map(x => {
            // overrideAll has some tpl using text, like:
            // extraVolumeMounts: |
            //   - name: extras
            //     mountPath: /usr/share/extras
            //     readOnly: true
            // which needs special handling:
            if (x.extraVolumes) x.extraVolumes = tpl(x.extraVolumes);
            if (x.extraVolumeMounts) x.extraVolumeMounts = tpl(x.extraVolumeMounts);
            if (x.extraInitContainers) x.extraInitContainers = tpl(x.extraInitContainers);
            return x;
        });
    return filtered.length === 1 ? filtered[0] : filtered;
}

export function getChart(options: MySqlOptions, chartOptions?: ChartOptions) {
    const app = new App();
    const chart = new Chart(app, 'release-name', chartOptions);
    new MySql(chart, 'release-name', options);
    return chart;
}


export function base64(s: string) {
    return new Buffer(s).toString('base64');
}


export function byKind(kind: string) {
    return (resources: { kind: string, [key: string]: any }[]) => resources.filter((x: any) => x.kind === kind);
}

byKind.Secret = byKind('Secret');
byKind.Deployment = byKind('Deployment');

export function tpl(tpl: any) {
    return jsyaml.load(tpl);
}


export function cleanHelm(resources: any[]) {
    // @ts-ignore
    return resources.map((r) => {
        let newVar = {...r};
        delete newVar.metadata?.labels?.chart;
        delete newVar.metadata?.labels?.heritage;
        return newVar;
    });
}

export function cleanNamespace(resources: any[]) {
    // @ts-ignore
    return resources.map(r => {

        let newVar = {...r};
        delete newVar.metadata.namespace;
        return newVar;
    })
}

export function readAndClean(file: string) {
    const snapshot = getYaml(file);
    // we clean the helm charts of namespace and helm-specific labels and annotations
    // to try to keep our tests a little cleaner.
    let expectedResource: any = cleanHelm(cleanNamespace(snapshot))
    return expectedResource;
}

let noFilter = () => true;

export function checkVariant(options: MySqlOptions,
                             byResourceType: (resources: { kind: string; [p: string]: any }[]) => { kind: string; [p: string]: any }[],
                             file: string = 'test/default.snapshot.yaml',
                             resourcefilter?: (x: any) => boolean) {
    const chart = getChart({...options});
    const [expectedResource] = byResourceType(readAndClean(file)).filter(resourcefilter || noFilter);
    const [actualResource] = byResourceType(Testing.synth(chart)).filter(resourcefilter || noFilter);
    if (expectedResource) {
        expect(actualResource).toMatchObject(expectedResource);
    } else {
        expect(actualResource).toBeFalsy();
    }
}
