// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as deepl from "deepl-node";

// Storage for the DeepL API Key
// Code inspired by https://stackoverflow.com/questions/51821924/how-to-persist-information-for-a-vscode-extension.
function KeyManager(context: vscode.ExtensionContext) {
  const STORAGE_KEY = "deeplApiKey";
  function getStoredKey() {
    return context.globalState.get(STORAGE_KEY) as string | undefined;
  }

  async function storeKey(newKey: string) {
    await context.globalState.update(STORAGE_KEY, newKey);
  }
  return {
    getStoredKey,
    storeKey,
  };
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  let translator: deepl.Translator | null = null;
  const { getStoredKey, storeKey } = KeyManager(context);
  const setTranslator = async () => {
    storedKey = getStoredKey();
    if (!storedKey) {
      return;
    }
    const translatorInstance = new deepl.Translator(storedKey);
    try {
      const result = await translatorInstance.translateText("Hello", null, "de");
      if (result.text === "Hallo") {
        translator = translatorInstance;
      } else {
        vscode.window.showErrorMessage("The API Key is invalid.");
      }
    } catch (e) {
      vscode.window.showErrorMessage(
        "The API Key is invalid or there was an error while trying to use it. Please look at the console output for more information.",
      );
      console.error(e);
    }
  };

  const promptAPIKey = async () => {
    const searchQuery = await vscode.window.showInputBox({
      placeHolder: "DeepL API Key",
      prompt:
        "This extension needs a DeepL API Key to work. Please generate one by creating an account on deepl.com.",
    });
    if (searchQuery !== undefined) {
      await storeKey(searchQuery);
      await setTranslator();
    } else {
      vscode.window.showErrorMessage("You need to provide an API Key to use this extension.");
    }
  };

  let storedKey = getStoredKey();
  if (storedKey === undefined) {
    promptAPIKey();
  } else {
    setTranslator();
  }

  // Register the command to enter the API Key.
  let disposable = vscode.commands.registerCommand("englishplusplus.enterapikey", () => {
    promptAPIKey();
  });
  context.subscriptions.push(disposable);

  // Command to fix the English of the selected text.
  // Code inspired by https://github.com/microsoft/vscode-extension-samples/blob/main/document-editing-sample/src/extension.ts.
  disposable = vscode.commands.registerCommand("englishplusplus.fixmyenglish", async function () {
    if (translator === null) {
      vscode.window.showErrorMessage(
        "No valid API Key was provided. Please enter a valid API Key to use this extension.",
      );
      return;
    }
    // Get the active text editor
    const editor = vscode.window.activeTextEditor;

    if (editor) {
      const document = editor.document;
      const selection = editor.selection;

      // Get the word within the selection
      const word = document.getText(selection);
      // TODO: Use deepl api
      const germanText = await translator.translateText(word, null, "de");
      const improvedEnglish = await translator.translateText(germanText.text, null, "en-US");

      editor.edit((editBuilder) => {
        editBuilder.insert(selection.end, `\n\t${improvedEnglish.text}`);
      });
    }
  });

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
