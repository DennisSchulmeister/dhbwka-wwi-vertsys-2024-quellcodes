window.addEventListener("DOMContentLoaded", async () => {
    // Benötigte HTML-Elemente ermitteln
    let commandNew         = document.querySelector("#cmd-new");
    let commandEdit        = document.querySelector("#cmd-edit");
    let commandDelete      = document.querySelector("#cmd-delete");
    let commandSave        = document.querySelector("#cmd-save");
    let commandCancel      = document.querySelector("#cmd-cancel");
    let commandBack        = document.querySelector("#cmd-back");

    let allCommands        = [commandNew, commandEdit, commandDelete, commandSave, commandCancel, commandBack];
    let overviewCommands   = [commandNew];
    let displayCommands    = [commandEdit, commandDelete, commandBack];
    let editCommands       = [commandSave, commandCancel];

    let snippetList        = document.querySelector("#snippet-list");
    
    let snippetEditor      = document.querySelector("#snippet-editor");
    let editorToolbar      = snippetEditor.querySelector(".toolbar");
    let snippetName        = snippetEditor.querySelector(".snippet-name");
    let snippetContent     = snippetEditor.querySelector(".snippet-content");
    let placeholderName    = snippetName.innerHTML;
    let placeholderContent = snippetContent.innerHTML;

    let snippetDisplay     = document.querySelector("#snippet-display");
    let snippetName1       = snippetDisplay.querySelector(".snippet-name");
    let snippetPre         = snippetDisplay.querySelector("pre");

    // Vorhandene Programmiersprachen laden
    let languagesResponse = await fetch("/api/language");
    let languages = await languagesResponse.json();

    let allLanguageLinks = [];
    let currentSnippet, allSnippets = [];

    for (let language of languages || []) {
        if (!language.label) continue;

        let aElement = document.createElement("a");
        editorToolbar.appendChild(aElement);

        aElement.href = "#";
        aElement.textContent = language.label;
        aElement.dataset.language = language.language;

        allLanguageLinks.push(aElement);

        aElement.addEventListener("click", () => {
            if (currentSnippet) {
                currentSnippet.language = aElement.dataset.language;
            }

            for (let languageLink of allLanguageLinks) languageLink.classList.remove("selected");
            aElement.classList.add("selected");
        });
    }        

    // Anzeigemodus der Benutzeroberfläche
    const MODE = {
        OVERVIEW_LIST:   0,
        EDIT_SNIPPET:    1,
        DISPLAY_SNIPPET: 2,
    };

    async function switchMode(mode, snippetId) {
        // Codeschnipsel vom Server laden
        if (!Number.isNaN(parseInt(snippetId))) {
            let response   = await fetch(`/api/snippet/${snippetId}`);
            currentSnippet = await response.json();
        } else if (snippetId) {
            let response = await fetch(`/api/snippet`);
            allSnippets  = await response.json();
        } else {
            currentSnippet = {
                id:       0,
                language: "",
                name:     "",
                content:  "",
            };
        };

        // UI-Elemente aktualisieren
        for (let command of allCommands) command.classList.add("hidden");

        switch (mode) {
            case MODE.OVERVIEW_LIST: {
                // Liste anzeigen
                snippetList.innerHTML = "";
                let number = 0;

                for (let snippet of allSnippets || []) {
                    if (!snippet.id) continue;
                    if (!snippet.name) continue;

                    let trElement = document.createElement("tr");
                    snippetList.appendChild(trElement);

                    let tdElement1 = document.createElement("td");
                    trElement.appendChild(tdElement1);
                    tdElement1.classList.add("linenumber");
                    tdElement1.textContent = ++number;

                    let tdElement2 = document.createElement("td");
                    trElement.appendChild(tdElement2);

                    let aElement = document.createElement("a");
                    tdElement2.appendChild(aElement);
                    aElement.href = "#";
                    aElement.textContent = snippet.name;

                    aElement.addEventListener("click", async () => {
                        await switchMode(MODE.DISPLAY_SNIPPET, snippet.id);
                    });
                }

                // UI-Elemente ein-/ausblenden
                for (let command of overviewCommands) command.classList.remove("hidden");

                snippetList.classList.remove("hidden");
                snippetEditor.classList.add("hidden");
                snippetDisplay.classList.add("hidden");

                break;
            }

            case MODE.EDIT_SNIPPET: {
                // Schnipsel anzeigen
                snippetName.textContent = currentSnippet?.name || "";
                blurSnippetName();

                snippetContent.textContent = currentSnippet?.content || "";
                blurSnippetContent();

                // Ausgewählte Sprache hervorheben
                for (let languageLink of allLanguageLinks) {
                    languageLink.classList.remove("selected");

                    if (languageLink.dataset.language === currentSnippet?.language) {
                        languageLink.classList.add("selected");
                    }
                }

                // UI-Elemente ein-/ausblenden
                for (let command of editCommands) command.classList.remove("hidden");

                snippetList.classList.add("hidden");
                snippetEditor.classList.remove("hidden");
                snippetDisplay.classList.add("hidden");

                break;
            }

            case MODE.DISPLAY_SNIPPET: {
                // Schnipsel anzeigen
                snippetName1.textContent = currentSnippet?.name || "";

                snippetPre.innerHTML = "";

                let snippetCode = document.createElement("code");
                snippetPre.appendChild(snippetCode);

                snippetCode.textContent = currentSnippet?.content || "";
                
                if (currentSnippet?.language) {
                    snippetCode.classList.add(`language-${currentSnippet?.language}`);
                } else {
                    snippetCode.classList.add("language-text");
                }

                snippetCode.classList.add("line-numbers");
                snippetCode.classList.add("match-braces");

                Prism.highlightAll();

                // UI-Elemente ein-/ausblenden
                for (let command of displayCommands) command.classList.remove("hidden");

                snippetList.classList.add("hidden");
                snippetEditor.classList.add("hidden");
                snippetDisplay.classList.remove("hidden");

                break;
            }
        }
    }

    await switchMode(MODE.OVERVIEW_LIST, true);

    // Toolbar-Button: Neuer Schnipsel
    commandNew.addEventListener("click", async () => {
        await switchMode(MODE.EDIT_SNIPPET);
    });

    // Toolbar-Button: Bearbeiten
    commandEdit.addEventListener("click", async () => {
        await switchMode(MODE.EDIT_SNIPPET, currentSnippet?.id || false);
    });

    // Toolbar-Button: Löschen
    commandDelete.addEventListener("click", async () => {
        let answer = confirm("Möchten Sie den Codeschnipsel wirklich löschen?");

        if (answer && currentSnippet?.id) {
            await fetch(`/api/snippet/${currentSnippet.id}`, {method: "DELETE"});
        }

        await switchMode(MODE.OVERVIEW_LIST, true);
    });

    // Toolbar-Button: Speichern
    commandSave.addEventListener("click", async () => {
        currentSnippet.name = snippetName.textContent.trim();
        currentSnippet.content = snippetContent.textContent;

        if (!currentSnippet.name) {
            alert("Geben Sie erst einen Namen ein.");
            return;
        }

        let response;

        if (currentSnippet.id) {
            response = await fetch(`/api/snippet/${currentSnippet.id}`, {
                method:  "PUT",
                headers: {"content-type": "application/json"},
                body:    JSON.stringify(currentSnippet),
            });
        } else {
            response = await fetch(`/api/snippet`, {
                method:  "POST",
                headers: {"content-type": "application/json"},
                body:    JSON.stringify(currentSnippet),
            });
        }

        if (response.status < 200 || response.status > 299) {
            alert(`Beim Speichern ist ein Fehler aufgetreten. Status-Code: ${response.status}`);
        }

        await switchMode(MODE.OVERVIEW_LIST, true);
    });

    // Toolbar-Button: Abbrechen
    commandCancel.addEventListener("click", async () => {
        let answer = confirm("Möchten Sie die Eingabe wirklich abbrechen ohne zu sichern?");

        if (answer) {
            await switchMode(MODE.OVERVIEW_LIST, true);
        }
    });

    // Toolbar-Button: Zurück
    commandBack.addEventListener("click", async () => {
        await switchMode(MODE.OVERVIEW_LIST, true);
    });

    // Platzhaltertexte in den Eingabefelder ein-/ausblenden
    snippetName.addEventListener("focus", () => {
        if (snippetName.classList.contains("empty")) {
            snippetName.classList.remove("empty");
            snippetName.innerHTML = "";
        }
    });

    snippetContent.addEventListener("focus", () => {
        if (snippetContent.classList.contains("empty")) {
            snippetContent.classList.remove("empty");
            snippetContent.innerHTML = "";
        }
    });

    function blurSnippetName() {
        if (!snippetName.textContent.trim()) {
            snippetName.innerHTML = placeholderName;
            snippetName.classList.add("empty");
        } else {
            snippetName.classList.remove("empty");
        }
    }

    function blurSnippetContent() {
        if (!snippetContent.textContent.trim()) {
            snippetContent.innerHTML = placeholderContent;
            snippetContent.classList.add("empty");
        } else {
            snippetContent.classList.remove("empty");
        }
    }

    snippetName.addEventListener("blur", blurSnippetName);
    snippetContent.addEventListener("blur", blurSnippetContent);

    // Copy & Paste: Immer unformatiert
    function onPasteEvent(event) {
        event.preventDefault();
        event.target.textContent = event.clipboardData.getData("text/plain");
    }

    snippetName.addEventListener("paste", onPasteEvent);
    snippetContent.addEventListener("paste", onPasteEvent);

    // Tab-Taste im Code-Editor
    // Vgl. https://stackoverflow.com/a/32128448
    snippetContent.addEventListener("keydown", event => {
        if (event.keyCode === 9) {
            event.preventDefault();
    
            let doc = snippetContent.ownerDocument.defaultView;
            let sel = doc.getSelection();
            let range = sel.getRangeAt(0);
    
            let spacesNode = document.createTextNode("    ");
            range.insertNode(spacesNode);
    
            range.setStartAfter(spacesNode);
            range.setEndAfter(spacesNode); 
            sel.removeAllRanges();
            sel.addRange(range);
        }
    });
});