const os = require('os');
const v8 = require('v8');

console.log('Build Environment Diagnostics');
console.log('----------------------------');
console.log('Node Version:', process.version);
console.log('Memory Usage:', process.memoryUsage());
console.log('Total System Memory:', os.totalmem() / 1024 / 1024, 'MB');
console.log('Free System Memory:', os.freemem() / 1024 / 1024, 'MB');
console.log('CPU Architecture:', os.arch());
console.log('CPU Cores:', os.cpus().length);
console.log('Heap Statistics:', v8.getHeapStatistics());
