import { handler as cloudWatchHandler } from "./cloudwatch-metrics-lambda";
import { handler as costExplorerHandler } from "./cost-explorer-metrics-lambda";

const handlers = {
  cloudwatch: cloudWatchHandler,
  "cost-explorer": costExplorerHandler,
} as const;

const handlerName = process.argv[2] as keyof typeof handlers | undefined;

(async () => {
  if (!handlerName || !handlers[handlerName]) {
    console.error("Usage: npm run run-cloudwatch | npm run run-cost-explorer");
    process.exitCode = 1;
  } else {
    const result = await handlers[handlerName]();
    console.log(JSON.stringify(result, null, 2));
  }
})();
