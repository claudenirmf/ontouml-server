const PROTO_PATH = './protos/ontouml-server.proto';
const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');

var packageDefinition = protoLoader.loadSync(PROTO_PATH,{
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});
var ontoumlserver = grpc.loadPackageDefinition(packageDefinition).ontoumlserver;

function main() {
  var client = new ontoumlserver.OntoUMLService('localhost:50051',grpc.credentials.createInsecure());
  // var model = require("../examples/m1.example.json");
  var model = require("../examples/m2.example.json");
  // var model = "";

  console.log('Initiating first request with model...\n' + model);
  client.verifyModel({model: JSON.stringify(model)}, function(err, diagnosis) {
    console.log('Diagnosis:');
    if (diagnosis && diagnosis.reply) {
      console.log(diagnosis.reply);
    }
  });
  console.log('Terminating client.');
}

main();
