import {
	// App,
	Editor,
	// MarkdownView,
	// Modal,
	// Notice,
	Plugin,
	// PluginSettingTab,
	// Setting,
	Vault,
} from "obsidian";
import { moment } from "obsidian";

import * as mpath from "path-browserify";
// import // ViewUpdate,
// // PluginValue,
// // EditorView,
// // ViewPlugin,
// "@codemirror/view";
// // import { syntaxTree } from "@codemirror/language";
// import // Extension,
// // RangeSetBuilder,
// // StateField,
// // Transaction,
// "@codemirror/state";
// // import  Decoration,
// // DecorationSet,
// // EditorView,
// // WidgetType,
// ("@codemirror/view");
// Remember to rename these classes and interfaces!
// import { WidgetType } from "@codemirror/view";

// export class EmojiWidget extends WidgetType {
// 	toDOM(view: EditorView): HTMLElement {
// 		const div = document.createElement("span");

// 		div.innerText = "👉";

// 		return div;
// 	}
// }
// export const emojiListField = StateField.define<DecorationSet>({
// 	create(state): DecorationSet {
// 		return Decoration.none;
// 	},
// 	update(oldState: DecorationSet, transaction: Transaction): DecorationSet {
// 		const builder = new RangeSetBuilder<Decoration>();

// 		syntaxTree(transaction.state).iterate({
// 			enter(node) {
// 				console.log("测试", node.type.name, node.from, node.to);
// 				if (node.type.name.startsWith("string_url")) {
// 					builder.add(
// 						node.from,
// 						node.to,
// 						Decoration.replace({
// 							widget: new EmojiWidget(),
// 						})
// 					);
// 				}
// 			},
// 		});

// 		return builder.finish();
// 	},
// 	provide(field: StateField<DecorationSet>): Extension {
// 		return EditorView.decorations.from(field);
// 	},
// });
// interface MyPluginSettings {
// 	mySetting: string;
// }

// const DEFAULT_SETTINGS: MyPluginSettings = {
// 	mySetting: "default",
// };
const saveFile = async (item: File, vault: Vault, editor: Editor) => {
	// 获取图片文件
	// const blob = item.getAsFile();
	// 生成唯一的文件名
	const date = moment().format("YYYYMMDDHHmmss");
	console.log("date", date, "ext", mpath.extname(item.name));
	const fileName = `${mpath.basename(
		item.name,
		mpath.extname(item.name)
	)}_${date}${mpath.extname(item.name)}`;

	// 构建完整的文件路径
	// 获取配置文件夹路径
	const configDirPath = vault.configDir;

	// 获取全局配置文件路径
	const globalConfigPath = `${configDirPath}/app.json`;

	// 读取全局配置文件内容
	const configContent = await vault.adapter.read(globalConfigPath);

	// 解析JSON配置内容
	const globalConfig = JSON.parse(configContent);

	// 现在你可以使用globalConfig对象来访问全局配置项
	console.log("Global configuration:", globalConfig);
	const filePath = `/${globalConfig["attachmentFolderPath"]}/${fileName}`;
	console.log("filePath", filePath);
	// 读取blob内容
	const buffer = await item.arrayBuffer();
	// 将图片保存到Vault
	if (buffer) {
		// 使用SubtleCrypto计算SHA-256哈希值
		const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);

		// 将哈希值转换为十六进制字符串
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		const hashHex = hashArray
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");

		console.log(`SHA-256 hash of the file is: ${hashHex}`);
		await vault.createBinary(filePath, buffer);
		// 获取图片路径，以便插入到笔记中
		const imageMarkdown = `![${filePath}](${filePath})`;
		// 插入图片Markdown到笔记
		editor.replaceSelection(imageMarkdown);
	}
};
export default class MyPlugin extends Plugin {
	// settings: MyPluginSettings;

	async onload() {
		// this.registerEditorExtension([examplePlugin, emojiListField]);
		this.app.workspace.onLayoutReady(() => {
			// this.app.workspace.on("note-drop", () => {});
			this.app.workspace.on("editor-drop", (evt, editor, info) => {
				console.log("drop", evt);
				console.log("drop", editor);
				console.log("drop", info);
				const files = evt.dataTransfer?.files;
				if (files) {
					for (let index = 0; index < files.length; index++) {
						const item = files[index];
						console.log("element", item);
						saveFile(item, this.app.vault, editor);
					}
					evt.preventDefault();
				}
			});
			this.app.vault.on("create", (f) => {
				console.log("vault", f);
				console.log(
					"vault editor",
					this.app.workspace.activeEditor?.editor
				);
				const editor = this.app.workspace.activeEditor?.editor;
				console.log("vault 粘贴数据", editor?.getValue());
				console.log("vault 粘贴数据", editor?.getSelection());
				// editor?.replaceSelection(encodeURIComponent(f.path));
			});
			this.app.workspace.on("editor-paste", async (evt, editor, info) => {
				evt.stopPropagation();

				console.log("item evt", evt);
				if (!evt.defaultPrevented) {
					const items = evt.clipboardData?.files;
					console.log("item items", items);
					if (items) {
						for (let index = 0; index < items.length; index++) {
							const item = items[index];
							console.log("item", item.type);
							if (item.type.indexOf("image") !== -1) {
								// 阻止默认的粘贴行为
								evt.preventDefault();
								saveFile(item, this.app.vault, editor);
							}
						}
					}
				}
			});
		});

		// this.registerDomEvent()
		this.app.workspace.on("editor-change", (editor, info) => {
			// evt.stopPropagation();
			console.log("change paste1", info.app.workspace.containerEl);
			// console.log("paste2", editor.getValue());
			// console.log("paste3", editor.getCursor());
			// editor.replaceSelection(
			// 	"/assets/" + editor.getValue(),
			// 	editor.getSelection()
			// );
		});

		// await this.loadSettings();

		// // This creates an icon in the left ribbon.
		// const ribbonIconEl = this.addRibbonIcon(
		// 	"dice",
		// 	"Sample Plugin",
		// 	(evt: MouseEvent) => {
		// 		// Called when the user clicks the icon.
		// 		new Notice("This is a notice!");
		// 	}
		// );
		// // Perform additional things with the ribbon
		// ribbonIconEl.addClass("my-plugin-ribbon-class");

		// // This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		// const statusBarItemEl = this.addStatusBarItem();
		// statusBarItemEl.setText("Status Bar Text");

		// // This adds a simple command that can be triggered anywhere
		// this.addCommand({
		// 	id: "open-sample-modal-simple",
		// 	name: "Open sample modal (simple)",
		// 	callback: () => {
		// 		new SampleModal(this.app).open();
		// 	},
		// });
		// // This adds an editor command that can perform some operation on the current editor instance
		// this.addCommand({
		// 	id: "sample-editor-command",
		// 	name: "Sample editor command",
		// 	editorCallback: (editor: Editor, view: MarkdownView) => {
		// 		console.log(editor.getSelection());
		// 		editor.replaceSelection("Sample Editor Command");
		// 	},
		// });
		// // This adds a complex command that can check whether the current state of the app allows execution of the command
		// this.addCommand({
		// 	id: "open-sample-modal-complex",
		// 	name: "Open sample modal (complex)",
		// 	checkCallback: (checking: boolean) => {
		// 		// Conditions to check
		// 		const markdownView =
		// 			this.app.workspace.getActiveViewOfType(MarkdownView);
		// 		if (markdownView) {
		// 			// If checking is true, we're simply "checking" if the command can be run.
		// 			// If checking is false, then we want to actually perform the operation.
		// 			if (!checking) {
		// 				new SampleModal(this.app).open();
		// 			}

		// 			// This command will only show up in Command Palette when the check function returns true
		// 			return true;
		// 		}
		// 	},
		// });

		// This adds a settings tab so the user can configure various aspects of the plugin
		// this.addSettingTab(new SampleSettingTab(this.app, this));
		// const editorEl = document.querySelector(".markdown-body");
		// const editorEl = this.app.workspace.containerEl;
		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(
			window.setInterval(() => console.log("setInterval"), 5 * 60 * 1000)
		);
	}

	onunload() {}

	// async loadSettings() {
	// 	this.settings = Object.assign(
	// 		{},
	// 		DEFAULT_SETTINGS,
	// 		await this.loadData()
	// 	);
	// }

	// async saveSettings() {
	// 	await this.saveData(this.settings);
	// }
}

// class SampleModal extends Modal {
// 	constructor(app: App) {
// 		super(app);
// 	}

// 	onOpen() {
// 		const { contentEl } = this;
// 		contentEl.setText("Woah!");
// 	}

// 	onClose() {
// 		const { contentEl } = this;
// 		contentEl.empty();
// 	}
// }

// class SampleSettingTab extends PluginSettingTab {
// 	plugin: MyPlugin;

// 	constructor(app: App, plugin: MyPlugin) {
// 		super(app, plugin);
// 		this.plugin = plugin;
// 	}

// 	display(): void {
// 		const { containerEl } = this;

// 		containerEl.empty();

// 		new Setting(containerEl)
// 			.setName("Setting #1")
// 			.setDesc("It's a secret")
// 			.addText((text) =>
// 				text
// 					.setPlaceholder("Enter your secret")
// 					.setValue(this.plugin.settings.mySetting)
// 					.onChange(async (value) => {
// 						this.plugin.settings.mySetting = value;
// 						await this.plugin.saveSettings();
// 					})
// 			);
// 	}
// }

// class ExamplePlugin implements PluginValue {
// 	constructor(view: EditorView) {
// 		// ...
// 		console.log("example init");
// 	}

// 	update(update: ViewUpdate) {
// 		// ...
// 		console.log(update);
// 	}

// 	destroy() {
// 		// ...
// 		console.log("example destroy");
// 	}
// }

// export const examplePlugin = ViewPlugin.fromClass(ExamplePlugin);
