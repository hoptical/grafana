import { CollectedData, DataCollector } from './DataCollector';
import { CDPDataCollector } from './CDPDataCollector';
import { fromPairs } from 'lodash';
import fs from 'fs';
const remoteDebuggingPortOptionPrefix = '--remote-debugging-port=';
import { json2csvAsync } from 'json-2-csv';

const getOrAddRemoteDebuggingPort = (args: string[]) => {
  const existing = args.find((arg) => arg.startsWith(remoteDebuggingPortOptionPrefix));

  if (existing) {
    return Number(existing.substring(remoteDebuggingPortOptionPrefix.length));
  }

  const port = 40000 + Math.round(Math.random() * 25000);
  args.push(`${remoteDebuggingPortOptionPrefix}${port}`);
  return port;
};

let collectors: DataCollector[] = [];
let results: CollectedData[] = [];

const startBenchmarking = async ({ testName }: { testName: string }) => {
  await Promise.all(collectors.map((coll) => coll.start({ id: testName })));

  return true;
};

const stopBenchmarking = async ({ testName }: { testName: string }) => {
  const data = await Promise.all(collectors.map(async (coll) => [coll.getName(), await coll.stop({ id: testName })]));

  results.push(fromPairs(data));

  return true;
};
const afterRun = async () => {
  await Promise.all(collectors.map((coll) => coll.close()));
  collectors = [];
  results = [];
};

const afterSpec = (resultsFolder: string) => async (spec: { name: string }) => {
  fs.writeFileSync(`${resultsFolder}/${spec.name}-${Date.now()}.csv`, await json2csvAsync(results));

  results = [];
};

export const initialize: Cypress.PluginConfig = (on, config) => {
  const resultsFolder = config.env['BENCHMARK_PLUGIN_RESULTS_FOLDER'];

  if (!fs.existsSync(resultsFolder)) {
    fs.mkdirSync(resultsFolder, { recursive: true });
    console.log(`Created folder for benchmark results ${resultsFolder}`);
  }

  on('before:browser:launch', async (browser, options) => {
    if (browser.family !== 'chromium' || browser.name === 'electron') {
      throw new Error('benchmarking plugin requires chrome');
    }

    const { args } = options;

    const port = getOrAddRemoteDebuggingPort(args);
    collectors.push(new CDPDataCollector({ port }));

    args.push('--start-fullscreen');

    console.log(
      `initialized benchmarking plugin with ${collectors.length} collectors: ${collectors
        .map((col) => col.getName())
        .join(', ')}`
    );

    return options;
  });

  on('task', {
    startBenchmarking,
    stopBenchmarking,
  });

  on('after:run', afterRun);
  on('after:spec', afterSpec(resultsFolder));
};
