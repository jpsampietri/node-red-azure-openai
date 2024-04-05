const { AzureKeyCredential, OpenAIClient } = require("@azure/openai");


module.exports = function (RED) {

    function AzureOpenAINode(config) {
        console.log('Azure OpenAI starting...');
        RED.nodes.createNode(this, config);
        this.endpoint = config.endpoint;
        this.apiKey = config.apiKey;
        this.deploymentId = config.deploymentId;

        var node = this;

        const client = new OpenAIClient(
            node.endpoint,
            new AzureKeyCredential(node.apiKey)
        );


        node.on('input', async function (msg) {
            let stdout = "";
            let err = "";

            const useAOAI = true;
            try {
                if (useAOAI) {
                    const events = await client.streamChatCompletions(node.deploymentId, msg.payload, { maxTokens: 128 });
                    let answer = [];
                    for await (const event of events) {
                        for (const choice of event.choices) {
                            const delta = choice.delta?.content;
                            if (delta !== undefined) {
                                answer.push(delta);
                            }
                        }
                    }
                    stdout = answer.join('');
                } else {
                    stdout = "Hardcoded answer";
                }
            } catch (error) {
                err = error;
                console.log('Azure OpenAI Response:\n' + JSON.stringify(error));
            }
            msg.payload = stdout;
            node.send([msg, err]);
        });
    }
    RED.nodes.registerType("azure-openai", AzureOpenAINode);
}