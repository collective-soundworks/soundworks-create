// change process.cwd() to soundworks application root
process.chdir('${d.relCwd}');
console.log('node running in:', process.cwd());
// import the client source file
import('${d.relClientPathname}');
