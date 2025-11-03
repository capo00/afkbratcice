//@@viewOn:imports
import {
  createVisualComponent,
  useEffect,
  useState,
  Utils,
  Lsi,
  useUpdateEffect,
  useBackground,
  useToolbar,
  useAppBackground,
} from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms from "uu5g05-forms";
import Uu5RichTextElements from "uu5richtextg01-elements";
import Uu5CodeKit from "uu5codekitg01";
import Config from "./config/config.js";
//@@viewOff:imports

function UpdateUu5StringModal({ value, onSubmit, onCancel }) {
  return (
    <Uu5Forms.Form.Provider onSubmit={(e) => onSubmit(new Utils.Event({ value: e.data.value.value }, e))}>
      <Uu5Elements.Modal
        open
        onClose={onCancel}
        header={<Lsi lsi={{ cs: "Upravit uu5String" }} />}
        footer={
          <Uu5Elements.Grid templateColumns="auto auto" justifyContent="end">
            <Uu5Forms.CancelButton onClick={onCancel} />
            <Uu5Forms.SubmitButton />
          </Uu5Elements.Grid>
        }
        width="full"
      >
        <Uu5Forms.Form.View>
          <Uu5CodeKit.FormUu5String name="value" initialValue={value} displayGutter={false} />
        </Uu5Forms.Form.View>
      </Uu5Elements.Modal>
    </Uu5Forms.Form.Provider>
  );
}

function RemoveSectionDialog({ onConfirm, onCancel }) {
  return (
    <Uu5Elements.Dialog
      open
      onClose={onCancel}
      header={<Lsi lsi={{ cs: "Smazat sekci?" }} />}
      icon={<Uu5Elements.Svg code="uugdssvg-svg-delete" />}
      info={<Lsi lsi={{ cs: "Data sekce nelze obnovit" }} />}
      actionDirection="horizontal"
      actionList={[
        {
          children: <Lsi lsi={{ cs: "Zrušit" }} />,
          onClick: onCancel,
        },
        {
          children: <Lsi lsi={{ cs: "Smazat" }} />,
          onClick: onConfirm,
          colorScheme: "negative",
          significance: "highlighted",
        },
      ]}
    />
  );
}

function RemoveComponentDialog({ onConfirm, onCancel }) {
  return (
    <Uu5Elements.Dialog
      open
      onClose={onCancel}
      header={<Lsi lsi={{ cs: "Smazat komponentu?" }} />}
      icon={<Uu5Elements.Svg code="uugdssvg-svg-delete" />}
      info={<Lsi lsi={{ cs: "Data komponenty nelze obnovit" }} />}
      actionDirection="horizontal"
      actionList={[
        {
          children: <Lsi lsi={{ cs: "Zrušit" }} />,
          onClick: onCancel,
        },
        {
          children: <Lsi lsi={{ cs: "Smazat" }} />,
          onClick: onConfirm,
          colorScheme: "negative",
          significance: "highlighted",
        },
      ]}
    />
  );
}

function createUu5String(uu5String, uu5ComponentData, context) {
  const path = [];
  let uu5StringObject = context.uu5StringObject;
  while (uu5StringObject) {
    const i = uu5StringObject.getIndex();
    path.unshift(i === -1 ? 0 : i);
    uu5StringObject = uu5StringObject.parent;
  }

  let childIndex = path.pop();

  const uu5StringData = JSON.parse(JSON.stringify(uu5String)); // Copy
  let parentChildren = uu5StringData;
  for (const i of path) {
    parentChildren = parentChildren[i].children;
  }

  parentChildren.splice(
    childIndex,
    1,
    ...(uu5ComponentData ? (Array.isArray(uu5ComponentData) ? uu5ComponentData : [uu5ComponentData]) : []),
  );

  return uu5StringData;
}

function formatTime(timeFrom) {
  return new Date(timeFrom).toLocaleTimeString("cs-CZ", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function startsWithUu5String(value) {
  return /^<uu5string\s*\/>/.test(value);
}

function Wrapper({ uu5Tag, props: initProps, children, context, onEditStart, onEditEnd }) {
  const { Component } = Utils.LibraryRegistry.getComponentByUu5Tag(uu5Tag);

  const [edit, setEdit] = useState(false);
  const [props, setProps] = useState(initProps);

  useUpdateEffect(() => {
    setProps(initProps);
  }, [initProps]);

  useEffect(() => {
    return () => {
      edit && onEditEnd({ ...context.uu5StringObject.toObject(), props });
    };
    // eslint-disable-next-line uu5/hooks-exhaustive-deps
  }, []);

  const bg = useBackground();

  const { renderRight } = useToolbar();

  const [updateModal, setUpdateModal] = useState();
  const [removeDialog, setRemoveDialog] = useState();

  const allProps = {
    ...props,
    getEditablePropValue: ({ props } = {}, propName) => {
      let result;
      if (propName === "children") {
        result = context.uu5StringObject.children
          .map((child) => (typeof child === "object" ? child.toString() : ""))
          .join("");
      } else {
        const { valueType, value } = context.uu5StringObject.props.props.find(({ name }) => name === propName) ?? {};

        if (valueType === "uu5string") {
          result = value.map((child) => (typeof child === "object" ? child.toString() : "")).join("");
        } else {
          result = context.uu5StringObject.props.toObject()[propName];
        }
      }

      return result;
    },
    editMode: edit
      ? {
        edit: true,
        onChange: (e) => {
          setProps({ ...props, ...e.props });
        },
        onEditEnd: (e) => {
          if (e.props) {
            if (!updateModal) {
              const uu5ComponentData = context.uu5StringObject.toObject();
              const { children, ...restProps } = e.props;
              const newUu5ComponentData = { ...uu5ComponentData, props: { ...uu5ComponentData.props, ...restProps } };
              if (children) {
                newUu5ComponentData.children = startsWithUu5String(children)
                  ? new Utils.Uu5String(children).toObject()
                  : children;
              }
              onEditEnd(newUu5ComponentData);
              setEdit(false);
            }
          } else {
            onEditEnd(null);
            setEdit(false);
          }
        },
      }
      : null,
    children,
  };

  const divClassName = Config.Css.css({
    minHeight: 0,
    transition: "min-height 0.2s ease-in-out",

    "*:hover > &": {
      minHeight: 16,
    },

    "&>*": {
      minHeight: "100%",
    },

    "&:hover": {
      outline: `1px dashed ${Uu5Elements.UuGds.Shape.getValue(["ground", bg, "building", "common", "marked", "colors", "border"])}`,
      outlineOffset: 8,
      borderRadius: 4,

      /* Remove outline if this div contains another hovered div */
      "&:has(&:hover)": {
        outline: "none",
      },
    },
  });

  let divAttrs;
  if (edit) {
    divAttrs = {
      className: [
        divClassName,
        Config.Css.css({
          outline: `1px dashed ${Uu5Elements.UuGds.Shape.getValue(["ground", bg, "primary", "common", "marked", "colors", "border"])}!important`,
          outlineOffset: 8,
          borderRadius: 4,
        }),
      ].join(" "),
    };
  } else {
    divAttrs = {
      onClick: async () => {
        await onEditStart();
        setEdit(true);
      },
      className: [divClassName, Config.Css.css({ "&>*": { pointerEvents: "none" } })].join(" "),
    };
  }

  return (
    <>
      <div {...divAttrs}>
        <Component {...allProps}>{children}</Component>
        {edit &&
          renderRight(
            <Uu5Elements.ActionGroup
              alignment="right"
              itemList={[
                { icon: "uugds-insert-below", disabled: true }, // TODO
                { icon: "uugds-insert-above", disabled: true }, // TODO
                { icon: "uugds-up", disabled: true }, // TODO
                { icon: "uugds-down", disabled: true }, // TODO
                {
                  icon: "uugds-copy",
                  onClick: () =>
                    Utils.Clipboard.write({
                      uu5String:
                        "<uu5string />" +
                        new Utils.Uu5String.Object({ ...context.uu5StringObject.toObject(), props }).toString(),
                    }),
                },
                {
                  collapsed: true,
                  icon: "uugdsstencil-it-div",
                  children: <Lsi lsi={{ cs: "Upravit uu5String" }} />,
                  onClick: async () => {
                    await onEditStart();
                    setUpdateModal(true);
                  },
                },
                {
                  collapsed: true,
                  icon: "uugds-delete",
                  colorScheme: "negative",
                  children: <Lsi lsi={{ cs: "Smazat" }} />,
                  onClick: () => setRemoveDialog(true),
                },
              ]}
              elementAttrs={{
                onClick: (e) => {
                  console.log("prevent click");
                  e.stopPropagation();
                }
              }}
            />,
          )}
      </div>
      {updateModal && (
        <UpdateUu5StringModal
          value={new Utils.Uu5String({ ...context.uu5StringObject.toObject(), props }).toString()}
          onSubmit={async (e) => {
            onEditEnd(
              e.data.value
                ? new Utils.Uu5String(
                  startsWithUu5String(e.data.value) ? e.data.value : "<uu5string/>" + e.data.value,
                ).toObject()
                : null,
            );
            setUpdateModal(false);
            setEdit(false);
          }}
          onCancel={() => {
            onEditEnd(null);
            setUpdateModal(false);
          }}
        />
      )}
      {removeDialog && (
        <RemoveComponentDialog
          onConfirm={async () => {
            onEditEnd(null);
            setRemoveDialog(false);
          }}
          onCancel={() => setRemoveDialog(false)}
        />
      )}
    </>
  );
}

const SectionEditable = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "SectionEditable",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    const { editMode, dto, onCreateBefore, onCreateAfter, onMoveUp, onMoveDown, onDelete, ...restProps } = props;

    const [updateModal, setUpdateModal] = useState();
    const [removeDialog, setRemoveDialog] = useState();

    const bg = useBackground();
    const { backgroundColor } = useAppBackground();

    async function onEditStart() {
      console.log("onEditStart");
      return dto.data.lock ? undefined : await dto.handlerMap.lock();
    }

    async function onEditEnd(uu5String) {
      console.log("onEditEnd");
      return await dto.handlerMap.unlock(
        uu5String && JSON.stringify(uu5String) !== JSON.stringify(dto.data.uu5String) ? { uu5String } : undefined,
      );
    }

    async function saveComponent(uu5ComponentData, context) {
      return await onEditEnd(
        uu5ComponentData ? createUu5String(dto.data.uu5String, uu5ComponentData, context) : uu5ComponentData,
      );
    }

    let result;
    if (dto.data.uu5String) {
      result = Utils.Uu5String.toChildren(dto.data.uu5String, {
        buildChildFn: (uu5Tag, props, children, context) => {
          return (
            <Wrapper
              uu5Tag={uu5Tag}
              props={props}
              context={context}
              onEditStart={onEditStart}
              onEditEnd={(uu5ComponentData) => saveComponent(uu5ComponentData, context)}
            >
              {children}
            </Wrapper>
          );
        },
      });
    } else {
      result = (
        <Uu5RichTextElements.Placeholder
          autoFocus
          onSave={(e) => {
            onEditEnd(startsWithUu5String(e.data.value) ? Utils.Uu5String.toObject(e.data.value) : e.data.value);
          }}
          className={Config.Css.css({ margin: -10 })}
        />
      );
    }

    const attrs = Utils.VisualComponent.getAttrs(
      restProps,
      Config.Css.css({
        margin: "-36px -16px -16px",
        padding: "0 15px 16px",
        border: `1px solid ${Uu5Elements.UuGds.Shape.getValue(["ground", bg, "building", "common", "marked", "colors", "border"])}`,
        borderRadius: 8,
      }),
    );

    //@@viewOn:render
    return (
      <>
        <fieldset {...attrs} disabled={dto.state === "pending"}>
          <legend style={{ textAlign: "right", backgroundColor }}>
            <Uu5Elements.ActionGroup
              itemList={[
                ...(dto.data.lock
                  ? [
                    {
                      icon: "uugds-lock-closed",
                      tooltip: `${formatTime(dto.data.lock.timeFrom)} - ${dto.data.lock.name} (${dto.data.lock.identity})`,
                    },
                  ]
                  : []),
                { icon: "uugds-insert-below", onClick: onCreateAfter },
                { icon: "uugds-insert-above", onClick: onCreateBefore },
                { icon: "uugds-up", onClick: onMoveUp },
                { icon: "uugds-down", onClick: onMoveDown },
                {
                  icon: "uugds-copy",
                  onClick: () => Utils.Clipboard.write({ uu5String: Utils.Uu5String.toString(dto.data.uu5String) }),
                },
                {
                  collapsed: true,
                  icon: "uugdsstencil-it-div",
                  children: <Lsi lsi={{ cs: "Upravit uu5String" }} />,
                  onClick: async () => {
                    await onEditStart();
                    setUpdateModal(true);
                  },
                },
                {
                  collapsed: true,
                  icon: "uugds-delete",
                  colorScheme: "negative",
                  children: <Lsi lsi={{ cs: "Smazat" }} />,
                  onClick: () => setRemoveDialog(true),
                },
              ]}
            />
          </legend>
          {result}
        </fieldset>
        {updateModal && (
          <UpdateUu5StringModal
            value={Utils.Uu5String.toString(dto.data.uu5String)}
            onSubmit={async (e) => {
              await onEditEnd(
                e.data.value
                  ? Utils.Uu5String.toObject(
                    startsWithUu5String(e.data.value) ? e.data.value : "<uu5string/>" + e.data.value,
                  )
                  : null,
              );
              setUpdateModal(false);
            }}
            onCancel={() => {
              onEditEnd(null);
              setUpdateModal(false);
            }}
          />
        )}
        {removeDialog && (
          <RemoveSectionDialog
            onConfirm={async (e) => {
              setRemoveDialog(false);
              onDelete();
            }}
            onCancel={() => setRemoveDialog(false)}
          />
        )}
      </>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { SectionEditable };
export default SectionEditable;
//@@viewOff:exports
