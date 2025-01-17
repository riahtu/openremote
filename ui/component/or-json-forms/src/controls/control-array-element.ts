import {
    computeLabel,
    createDefaultValue,
    JsonSchema,
    mapDispatchToArrayControlProps,
    Paths,
    RendererProps,
    Resolve,
    update
} from "@jsonforms/core";
import {css, html, PropertyValues, TemplateResult, unsafeCSS} from "lit";
import {customElement, property} from "lit/decorators.js";
import {CombinatorInfo, controlWithoutLabel, getCombinatorInfos, getTemplateFromProps} from "../util";
import {InputType, OrMwcInput} from "@openremote/or-mwc-components/or-mwc-input";
import {i18next} from "@openremote/or-translate";
import {showDialog} from "@openremote/or-mwc-components/or-mwc-dialog";
import "@openremote/or-mwc-components/or-mwc-list";
import {addItemOrParameterDialogStyle, baseStyle} from "../styles";
import {ListItem, OrMwcListChangedEvent} from "@openremote/or-mwc-components/or-mwc-list";
import {DefaultColor4, DefaultColor5} from "@openremote/core";
import "../json-editor";
import {JsonEditor} from "../json-editor";
import {ControlBaseElement} from "./control-base-element";
import {getTemplateWrapper} from "../index";
import {AdditionalProps} from "../base-element";

// language=CSS
const style = css`
    :host, .item-border, .drag-handle {
        border-color: var(--or-app-color5, ${unsafeCSS(DefaultColor5)});
        border-radius: 4px;
        border-width: 1px;
        border-style: solid;
    }

    .item-wrapper {
        display: flex;
    }
    
    .item-container {
        flex: 1;
    }

    .item-border {
        flex: 1;
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
    }
    
    #expander {
        --or-icon-width: 20px;
        --or-icon-height: 20px;
        cursor: pointer;
        flex: 1 1 auto;
    }
    
    #expander > * {
        pointer-events: none;
    }
    
    #expander > or-icon {
        vertical-align: middle;
        margin-right: 6px;
        margin-left: -5px;
    }
    
    #header {
        display: flex;
        align-items: center;
        height: 50px;
    }
    
    #content {
        display: flex;
        flex-direction: column;
    }

    #content .item-container:first-child {
        margin-top: 0;
    }
    
    #add-parameter {
        margin: 10px 0 0 4px;
    }
    
    :host, .padded {
        padding: 10px 16px;
    }
    
    .item-border > .item-container {
        margin: 0;
    }
    
    .item-border > .item-container > .delete-container {
        display: none;
    }

    .item-border > .item-container :first-child {
        border: 0;
        padding: 0;
        margin: 0;
        flex: 1;
    }

    .draggable.dragging {
        opacity: 0.5;
    }
    
    .draggable.indicator-after {
        border-bottom-width: 3px;
        border-bottom-style: solid;
        border-bottom-color: var(--or-app-color4, ${unsafeCSS(DefaultColor4)});
    }
    
    .draggable.indicator-before {
        border-top-width: 3px;
        border-top-style: solid;
        border-top-color: var(--or-app-color4, ${unsafeCSS(DefaultColor4)});
    }
    
    .drag-handle {
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;
        border-right: 0;
        cursor: grab;
        flex: 0 0 auto;
        width: 20px;
        padding: 3px;
    }
    
    .drag-handle > div {
        height: 100%;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10'%3E%3Cg%3E%3Cellipse fill='%23cecece' cx='5' cy='5' rx='2.5' ry='2.5'/%3E%3C/g%3E%3C/svg%3E");
    }
`;

@customElement("or-json-forms-array-control")
export class ControlArrayElement extends ControlBaseElement {

    @property()
    protected minimal?: boolean;
    protected resolvedSchema!: JsonSchema;
    protected itemInfos: CombinatorInfo[] | undefined;
    protected addItem!: (value: any) => void;
    protected removeItem!: (index: number) => void;
    protected moveItem!: (fromIndex: number, toIndex: number) => void;

    public static get styles() {
        return [
            baseStyle,
            style
        ];
    }

    shouldUpdate(_changedProperties: PropertyValues): boolean {
        if (_changedProperties.has("schema")) {
            this.itemInfos = undefined;
            this.resolvedSchema = Resolve.schema(this.schema, 'items', this.rootSchema);

            if (Array.isArray(this.resolvedSchema.anyOf)) {
                this.itemInfos = getCombinatorInfos(this.resolvedSchema.anyOf, this.rootSchema);
            } else if (Array.isArray(this.resolvedSchema.oneOf)) {
                this.itemInfos = getCombinatorInfos(this.resolvedSchema.oneOf, this.rootSchema);
            }
        }

        if (_changedProperties.has("state")) {
            const dispatchMethods = mapDispatchToArrayControlProps(this.state.dispatch);
            this.addItem = (value) => dispatchMethods.addItem(this.path, value)();
            this.removeItem = (index) => {
                dispatchMethods.removeItems!(this.path, [index])();
            };
            this.moveItem = (fromIndex, toIndex) => {
                const move = (input: [], from: number, to: number) => {
                    let numberOfDeletedElm = 1;
                    const elm = input.splice(from, numberOfDeletedElm)[0];
                    numberOfDeletedElm = 0;
                    input.splice(to, numberOfDeletedElm, elm);
                };

                this.state.dispatch(
                    update(this.path, array => {
                        move(array, fromIndex, toIndex);
                        return array;
                    })
                );
            };
        }

        return super.shouldUpdate(_changedProperties);
    }

    render() {

        const maxItems = this.schema.maxItems ?? Number.MAX_SAFE_INTEGER;
        const itemCount = Array.isArray(this.data) ? (this.data as []).length : 0;

        return html`
            <div id="panel">
                ${this.minimal ? html`` : html`
                    <div id="header">
                        <div id="expander"><or-icon icon="chevron-right"></or-icon><span>${this.label ? computeLabel(this.label, this.required, false) : ""}</span></div>
                        <div id="header-buttons"><or-mwc-input .type="${InputType.BUTTON}" outlined .label="${i18next.t("json")}" icon="pencil" @click="${() => this._showJson()}"></or-mwc-input></div>
                    </div>
                `}
                <div id="content" @dragover="${(ev: DragEvent) => this._onDragOver(ev)}">
                    
                    ${!Array.isArray(this.data) ? `` : (this.data as any[]).map((item, index) => {
    
                        const childPath = Paths.compose(this.path, "" + index);
                        const constProp = this.itemInfos && this.itemInfos.length > 0 ? this.itemInfos[0].constProperty : undefined;
                        const childConstValue = constProp ? item[constProp] : undefined;
                        const childMatchedItemInfo = childConstValue ? this.itemInfos?.find(itemInfo => itemInfo.constValue === childConstValue) : undefined;
                        const childLabel = childMatchedItemInfo ? childMatchedItemInfo.title : "";
                        
                        const props: RendererProps & AdditionalProps = {
                            renderers: this.renderers,
                            uischema: controlWithoutLabel("#"),
                            enabled: this.enabled,
                            visible: this.visible,
                            path: childPath,
                            schema: this.resolvedSchema,
                            label: childLabel,
                            required: false
                        };
                        
                        return this.getArrayItemWrapper(getTemplateFromProps(this.state, props), index);
                    })}

                </div>
                
                <div id="add-parameter">
                    <or-mwc-input .disabled="${itemCount && itemCount >= maxItems}" .type="${InputType.BUTTON}" .label="${i18next.t("addItem")}" icon="plus" @click="${() => this.doAddItem()}"></or-mwc-input>
                </div>
            </div>
        `;
    }

    protected getArrayItemWrapper(elementTemplate: TemplateResult, index: number) {

        elementTemplate = html`
            <div class="drag-handle">
                <div></div>
            </div>
            <div class="item-border padded">
                ${elementTemplate}
            </div>
        `;

        return html`
            <div class="item-wrapper draggable" data-index="${index}" draggable="true" @dragstart="${(ev: DragEvent) => this._onDragStart(ev)}" @dragend="${(ev: DragEvent) => this._onDragEnd(ev)}">
                ${getTemplateWrapper(elementTemplate, () => this.removeItem(index))}
            </div>
        `;
    }

    protected _onDragStart(ev: DragEvent) {
        const dragging = ev.currentTarget as HTMLDivElement;
        dragging.classList.add("dragging");
    }

    protected _onDragEnd(ev: DragEvent) {
        const container = this.shadowRoot!.getElementById("content") as HTMLDivElement;
        const draggables = [...(container.children as any)] as HTMLDivElement[];
        const dragging = ev.currentTarget as HTMLDivElement;
        dragging.classList.remove("dragging");
        const index = Number(dragging.getAttribute("data-index"));
        const afterIndex = dragging.getAttribute("data-after-index") !== null ? Number(dragging.getAttribute("data-after-index")) : (this.data as []).length - 1;

        draggables.forEach(draggable => draggable.classList.remove("indicator-before", "indicator-after"));

        if (index === afterIndex) {
            return;
        }

        this.moveItem(index, afterIndex);
    }

    protected _onDragOver(ev: DragEvent) {
        const dragging = this.shadowRoot!.querySelector(".dragging") as HTMLDivElement;

        if (!dragging) {
            return;
        }

        ev.preventDefault();
        const container = ev.currentTarget as HTMLDivElement;
        const draggables = [...((this.shadowRoot!.querySelectorAll(".draggable:not(.dragging)") as any) as HTMLDivElement[])];
        const initial = {offset: Number.NEGATIVE_INFINITY, element: null} as {
            offset: number,
            element: HTMLDivElement | null
        };

        const afterItem = draggables.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = ev.clientY - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return {offset: offset, element: child};
            } else {
                return closest;
            }
        }, initial).element;

        draggables.forEach(draggable => draggable.classList.remove("indicator-before", "indicator-after"));

        if (afterItem === null) {
            draggables[draggables.length-1].classList.add("indicator-after");
            dragging.removeAttribute("data-after-index");
        } else {
            const afterIndex = afterItem.getAttribute("data-index");
            afterItem.classList.add("indicator-before");
            if (afterIndex !== null) {
                dragging.setAttribute("data-after-index", afterIndex);
            } else {
                dragging.removeAttribute("data-after-index");
            }
        }
    }

    protected _showJson() {
        const dialog = showDialog(
            {
                content: html`
                    <or-json-forms-json-editor id="json-editor" .json="${this.data === undefined ? "" : JSON.stringify(this.data, null, 2)}"></or-json-forms-json-editor>
                `,
                actions: [
                    {
                        actionName: "cancel",
                        content: i18next.t("cancel")
                    },
                    {
                        default: true,
                        actionName: "update",
                        action: () => {
                            const editor = dialog.shadowRoot!.getElementById("json-editor") as JsonEditor;
                            if (editor.validate()) {
                                const data = !!editor.getValue() ? JSON.parse(editor.getValue()!) : undefined;
                                this.state.dispatch(
                                    update(this.path || "", (d) => {
                                        return data;
                                    })
                                )
                            }
                        },
                        content: html`<or-mwc-input id="add-btn" .type="${InputType.BUTTON}" .label="${i18next.t("update")}"></or-mwc-input>`
                    }
                ],
                title: this.title || this.schema.title,
                dismissAction: null,
                styles: html`
                <style>
                    .mdc-dialog__surface {
                        width: 1024px;
                        overflow-x: visible !important;
                        overflow-y: visible !important;
                    }
                    #dialog-content {
                        border-color: var(--or-app-color5, ${unsafeCSS(DefaultColor5)});
                        border-top-width: 1px;
                        border-top-style: solid;
                        border-bottom-width: 1px;
                        border-bottom-style: solid;
                        padding: 0;
                        overflow: visible;
                        height: 60vh;
                    }
                </style>
            `
            }
        )
    }

    protected doAddItem() {
        if (!this.resolvedSchema) {
            return;
        }

        if (this.itemInfos) {
            this.showAddDialog();
        } else {
            this.addItem(createDefaultValue(this.resolvedSchema));
        }
    }

    protected showAddDialog() {

        let selectedItemInfo: CombinatorInfo | undefined;

        const listItems: ListItem[] = this.itemInfos!.map((itemInfo, index) => {
            const labelStr = itemInfo.title ? computeLabel(itemInfo.title, false, true) : "";
            return {
                text: labelStr,
                value: labelStr,
                data: itemInfo
            }
        });

        const onParamChanged = (itemInfo: CombinatorInfo) => {
            selectedItemInfo = itemInfo;
            const descElem = dialog.shadowRoot!.getElementById("parameter-desc") as HTMLDivElement;
            descElem.innerHTML = itemInfo.description || "";
            (dialog.shadowRoot!.getElementById("add-btn") as OrMwcInput).disabled = false;
        };

        const dialog = showDialog({
            content: html`
                <div class="col">
                    <form id="mdc-dialog-form-add" class="row">
                        <div id="type-list" class="col">
                            <or-mwc-list @or-mwc-list-changed="${(evt: OrMwcListChangedEvent) => {if (evt.detail.length === 1) onParamChanged((evt.detail[0] as ListItem).data as CombinatorInfo); }}" .listItems="${listItems.sort((a, b) => a.text!.localeCompare(b.text!))}" id="parameter-list"></or-mwc-list>
                        </div>
                        <div id="parameter-desc" class="col"></div>
                    </form>
                </div>
            `,
            styles: addItemOrParameterDialogStyle,
            title: (this.label ? computeLabel(this.label, this.required, false) + " - " : "") + i18next.t("addItem"),
            actions: [
                {
                    actionName: "cancel",
                    content: i18next.t("cancel")
                },
                {
                    default: true,
                    actionName: "add",
                    action: () => {
                        if (selectedItemInfo) {
                            const value = selectedItemInfo.defaultValueCreator();
                            this.addItem(value);
                        }
                    },
                    content: html`<or-mwc-input id="add-btn" .type="${InputType.BUTTON}" disabled .label="${i18next.t("add")}"></or-mwc-input>`
                }
            ],
            dismissAction: null
        });
    }
}
