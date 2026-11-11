/*
 * (c) Copyright Ascensio System SIA 2010-2025
 *
 * This program is a free software product. You can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License (AGPL)
 * version 3 as published by the Free Software Foundation. In accordance with
 * Section 7(a) of the GNU AGPL its Section 15 shall be amended to the effect
 * that Ascensio System SIA expressly excludes the warranty of non-infringement
 * of any third-party rights.
 *
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR  PURPOSE. For
 * details, see the GNU AGPL at: http://www.gnu.org/licenses/agpl-3.0.html
 *
 * You can contact Ascensio System SIA at 20A-6 Ernesta Birznieka-Upish
 * street, Riga, Latvia, EU, LV-1050.
 *
 * The  interactive user interfaces in modified source and object code versions
 * of the Program must display Appropriate Legal Notices, as required under
 * Section 5 of the GNU AGPL version 3.
 *
 * Pursuant to Section 7(b) of the License you must retain the original Product
 * logo when distributing the program. Pursuant to Section 7(e) we decline to
 * grant you any rights under trademark law for use of our trademarks.
 *
 * All the Product's GUI elements, including illustrations and icon sets, as
 * well as technical writing content are licensed under the terms of the
 * Creative Commons Attribution-ShareAlike 4.0 International. See the License
 * terms at http://creativecommons.org/licenses/by-sa/4.0/legalcode
 *
 */

// The AI plugin of the desktop editors of the open-source edition. It is the AI
// plugin (sdkjs-plugin-ai) without its engine: the same toolbar, and every button
// shows the introduction of the AI addon. The addon brings the real plugin, with
// the same guid and a higher version.

(function(window, undefined)
{
	function showIntro()
	{
		if (window.AscDesktopEditor && window.AscDesktopEditor.execCommand)
			window.AscDesktopEditor.execCommand("addon:action", "intro");
	}

	function getToolBarButtonIcons(icon)
	{
		return "resources/icons/%theme-type%(light|dark)/big/" + icon + "%scale%(default).png";
	}

	function getActionIcons(icon)
	{
		return "resources/icons/actions/%theme-type%(light|dark)/" + icon + "%scale%(*).%extension%(svg)";
	}

	function getEditorType()
	{
		if (window.Asc.plugin.info.editorSubType === "pdf")
			return "pdf";
		return window.Asc.plugin.info.editorType;
	}

	function executeMethod(name, args)
	{
		return new Promise(function(resolve)
		{
			window.Asc.plugin.executeMethod(name, args || [], resolve);
		});
	}

	async function getEditorVersion()
	{
		let version = await executeMethod("GetVersion");
		if (!version || "develop" == version)
			version = "99.99.99";

		let arrVer = version.split(".");
		while (3 > arrVer.length)
			arrVer.push("0");

		return 1000000 * parseInt(arrVer[0]) + 1000 * parseInt(arrVer[1]) + parseInt(arrVer[2]);
	}

	function addButton(parent, text, icons)
	{
		let button = new Asc.ButtonToolbar(parent);
		button.text = text;
		button.icons = icons;
		button.attachOnClick(showIntro);
		return button;
	}

	function getMenu(items)
	{
		return items.map(function(item)
		{
			return { text : item[0], id : item[1], onclick : showIntro };
		});
	}

	// the toolbar of registerButtons in scripts/register.js of the AI plugin,
	// without the buttons of the saved quick actions and assistants; the context
	// menu and the floating chat button are not needed
	async function registerButtons()
	{
		let editorType = getEditorType();
		let editorVersion = await getEditorVersion();

		let buttonMainToolbar = new Asc.ButtonToolbar();
		buttonMainToolbar.text = "AI Tools";

		if (!serverSettings)
			addButton(buttonMainToolbar, "Settings", getToolBarButtonIcons("settings"));

		let buttonChat = addButton(buttonMainToolbar, "AI Chat", getToolBarButtonIcons("ask-ai"));
		if (!serverSettings)
			buttonChat.separator = true;

		if (editorType === "word")
		{
			let buttonQuickAction = addButton(buttonMainToolbar, "Create Quick AI Action", getActionIcons("quick-action"));
			buttonQuickAction.separator = true;
		}

		if (editorType !== "pdf")
			addButton(buttonMainToolbar, "Summarization", getToolBarButtonIcons("summarization"));

		let buttonTranslation = addButton(buttonMainToolbar, "Translation", getToolBarButtonIcons("translation"));
		buttonTranslation.menu = getMenu([["Settings", "t10n-settings"]]);
		buttonTranslation.split = true;

		if (editorType === "word")
		{
			let buttonAssistant = addButton(buttonMainToolbar, "Create AI assistant", getToolBarButtonIcons("plugin-writer"));
			buttonAssistant.separator = true;

			addButton(buttonMainToolbar, "Show all results", getToolBarButtonIcons("btn-listbox"));
		}

		let lastButton = null;
		if (editorVersion >= 9002000 && editorType === "word")
		{
			let buttonGS = addButton(buttonMainToolbar, "Grammar & Spelling", getToolBarButtonIcons("grammar"));
			buttonGS.menu = getMenu([["Check all", "sg10n-check-all"], ["Check current text", "sg10n-check-text"]]);
			lastButton = buttonGS;
		}

		if (editorVersion >= 9003000 && window.AscDesktopEditor && editorType === "word")
		{
			if (true === await executeMethod("IsFillingOFormMode"))
				lastButton = addButton(buttonMainToolbar, "Generate Document", getToolBarButtonIcons("form-to-doc"));
		}

		if (editorVersion >= 9004000 && editorType === "word")
		{
			let isEditForm = await executeMethod("IsEditingOFormMode");
			let isFillForm = await executeMethod("IsFillingOFormMode");
			if (isEditForm || isFillForm)
			{
				addButton(buttonMainToolbar, "Convert to form", getToolBarButtonIcons("form-to-doc"));
				addButton(buttonMainToolbar, "Make form correct", getToolBarButtonIcons("form-to-doc"));
			}
		}

		if (lastButton)
			lastButton.split = true;

		if (editorType === "pdf")
			addButton(buttonMainToolbar, "OCR", getToolBarButtonIcons("ocr"));

		Asc.Buttons.registerToolbarMenu();
	}

	// the buttons are registered once the plugin is initialized and translated
	let serverSettings = null;
	let initCounter = 0;
	async function initWithTranslate(counter)
	{
		initCounter |= counter;
		if (3 === initCounter)
		{
			initCounter = 5;
			await registerButtons();
		}
	}

	window.Asc.plugin.init = async function()
	{
		if (window.Asc.plugin.info.aiPluginSettings)
		{
			try {
				serverSettings = JSON.parse(window.Asc.plugin.info.aiPluginSettings);
			} catch (e) {
				serverSettings = null;
			}
			delete window.Asc.plugin.info.aiPluginSettings;
		}

		await initWithTranslate(1 << 1);
	};

	window.Asc.plugin.onTranslate = async function()
	{
		await initWithTranslate(1);
	};

	window.Asc.plugin.button = function(id, windowId)
	{
	};

})(window, undefined);
