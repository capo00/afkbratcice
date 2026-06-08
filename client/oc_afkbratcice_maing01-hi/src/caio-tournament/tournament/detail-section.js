import { createVisualComponent, Lsi, useScreenSize, useState } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms from "uu5g05-forms";
import Config from "./config/config.js";
import OcAuth from "../../libs/oc_cli-auth/index.js";
import Uu5Extras from "uu5extrasg01";
import { useTournament } from "./tournament-context.js";
import { useParticipantList } from "../participant/participant-context.js";
import { useMatchList } from "../match/match-context.js";

function Info(props) {
  const { data, isOperator } = props;
  return (
    <div>
      {isOperator && data.operativeList?.length > 0 ? (
        <Uu5Elements.Block headerType="heading" level={5} header={<Lsi lsi={{ cs: "Operátoři" }} />}>
          {data.operativeList.map((item) => <OcAuth.IdentityItem identity={item} />)}
        </Uu5Elements.Block>
      ) : undefined}
      {data.refereeList?.length > 0 ? (
        <Uu5Elements.Block headerType="heading" level={5} header={<Lsi lsi={{ cs: "Rozhodčí" }} />} className={Config.Css.css({ marginBlockStart: 16 })}>
          {data.refereeList.map((item) => <OcAuth.IdentityItem identity={item} key={item} />)}
        </Uu5Elements.Block>
      ) : undefined}
    </div>
  );
}

const DetailSection = createVisualComponent({
  uu5Tag: Config.TAG + "Tournament.Detail.DetailSection",

  render(props) {
    const { isAuth, isOperator, ...restProps } = props;

    const [editOpen, setEditOpen] = useState(false);
    const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);

    const [screenSize] = useScreenSize();
    const isSmall = screenSize === "xs";

    const tournamentDto = useTournament();
    const participantList = useParticipantList();
    const matchList = useMatchList();

    // console.log("tournamentDto", tournamentDto);
    // console.log("participantList", participantList);
    // console.log("matchList", matchList);

    const { data, handlerMap } = tournamentDto;

    const isCreated = data.state === "created";
    const isGroup = data.state === "group";
    const isPlayOff = data.state === "playoff";
    const isCompleted = data.state === "completed";

    const participants = (participantList?.data || []).map((d) => d.data || d);
    const allAssigned = participants.length >= (data.groupCount || 1) * (data.advanceFromGroup || 2) &&
      participants.every((p) => p.group && p.seed != null && p.seed > 0);

    const allMatchesPlayed = matchList.data?.every((item) => item.data.state === "played");

    const actionList = [];
    if (isOperator && isCreated) {
      actionList.push({
        icon: "uugds-pencil",
        children: <Lsi lsi={{ cs: "Upravit turnaj" }} />,
        onClick: () => setEditOpen(true),
      });
    }

    if (isOperator && isCreated && allAssigned) {
      actionList.push({
        icon: "uugdsstencil-media-play-solid",
        children: <Lsi lsi={{ cs: "Generovat zápasy" }} />,
        colorScheme: "positive",
        significance: "highlighted",
        onClick: () => handlerMap.generateMatches(),
      });
    }

    if (isOperator && isGroup && allMatchesPlayed) {
      actionList.push({
        icon: "uugds-plus-circle",
        children: <Lsi lsi={{ cs: "Generovat play-off" }} />,
        colorScheme: "positive",
        onClick: async () => {
          await handlerMap.generatePlayoff();
          handlerMap.load();
        },
      });
    }

    if (isOperator && isPlayOff && allMatchesPlayed) {
      actionList.push({
        icon: "uugds-check",
        children: <Lsi lsi={{ cs: "Vyhodnocení" }} />,
        colorScheme: "positive",
        onClick: async () => {
          await handlerMap.evaluate();
          handlerMap.load();
        },
      });
    }

    if (isAuth && isCompleted) {
      actionList.push({
        icon: "uugds-lock-closed",
        children: <Lsi lsi={{ cs: "Uzavřít" }} />,
        colorScheme: "negative",
        onClick: () => setCloseConfirmOpen(true),
      });
    }

    if (isSmall) {
      actionList.push({
        icon: "uugdsstencil-media-qr-code",
        collapsedChildren: <Lsi lsi={{ cs: "QR kód" }} />,
        itemList: [{
          component: () => <Uu5Extras.QRCode value={location.href} size="l" />
        }],
        iconOpen: null,
        iconClosed: null,
      });
    }

    const infoList = [
      {
        icon: Config.STATE_MAP[data.state]?.icon,
        colorScheme: Config.STATE_MAP[data.state]?.colorScheme,
        significance: "highlighted",
        title: Config.STATE_MAP[data.state]?.children,
        subtitle: data.type ? Config.TYPE_MAP[data.type]?.children || data.type : "-"
      }
    ];

    if (isSmall) {
      if (data.date || data.place) {
        let icon = "uugds-calendar";
        let subtitle = data.place ?? <Lsi lsi={{ cs: "Datum" }} />;
        let title = <Uu5Elements.DateTime value={data.date} timeFormat="none" />;
        if (!data.date) {
          icon = "uugds-mapmarker";
          subtitle = <Lsi lsi={{ cs: "Místo" }} />;
          title = data.place;
        }
        infoList.push({ icon, subtitle, title });
      }
    } else {
      if (data.date) {
        infoList.push({ icon: "uugds-calendar", title: <Uu5Elements.DateTime value={data.date} timeFormat="none" />, subtitle: <Lsi lsi={{ cs: "Datum" }} /> });
      }
      if (data.place) {
        infoList.push({ icon: "uugds-mapmarker", title: data.place, subtitle: <Lsi lsi={{ cs: "Místo" }} /> });
      }
    }

    return (
      <>
        <Uu5Elements.Block
          {...restProps}
          headerType="heading"
          header={isAuth ? (
            <div className={Config.Css.css({ display: "flex", alignItems: "center", gap: 8 })}>
              <Uu5Elements.Button
                size="l"
                icon="uugds-corner-start-up"
                href="caio-tournament/tournament"
                significance="subdued"
              />
              <span>{data.name}</span>
            </div>
          ) : data.name}
          actionList={actionList.length > 0 ? actionList : undefined}
          info={(isOperator && data.operativeList?.length > 0) || (data.refereeList?.length > 0 && isSmall) ?
            [{ label: "", children: <Info data={data} isOperator={isOperator} /> }] :
            undefined}
        />

        {editOpen && (
          <Uu5Forms.Form.Provider
            onSubmit={async (e) => {
              const { sys, ...submitData } = e.data.value;
              const update = {};
              for (const k in submitData) {
                if (submitData[k] != data[k]) {
                  update[k] = submitData[k] ?? null;
                  if (k === "operativeList" || k === "refereeList") {
                    update[k] = submitData[k]?.map((item) => item.value) ?? null;
                  }
                }
              }
              if (Object.keys(update).length > 0) {
                await handlerMap.update(update);
              }
              setEditOpen(false);
            }}
          >
            <Uu5Elements.Modal
              open
              onClose={() => setEditOpen(false)}
              header={<Lsi lsi={{ cs: "Upravit turnaj" }} />}
              footer={
                <Uu5Elements.Grid
                  templateColumns={{ xs: "1fr 1fr", s: "auto auto" }}
                  columnGap={8}
                  justifyContent={{ s: "end" }}
                >
                  <Uu5Forms.CancelButton onClick={() => setEditOpen(false)} />
                  <Uu5Forms.SubmitButton icon="uugds-check"><Lsi lsi={{ cs: "Upravit" }} /></Uu5Forms.SubmitButton>
                </Uu5Elements.Grid>
              }
            >
              <Uu5Forms.Form.View
                gridLayout={{
                  xs: "name, date, place, desc, groupCount, advanceFromGroup, venueCount, operativeList, refereeList",
                  s: "name venueCount, date place, desc desc, groupCount advanceFromGroup, operativeList refereeList",
                }}
              >
                <Uu5Forms.FormText name="name" label={{ cs: "Název" }} initialValue={data.name ?? undefined} required />
                <Uu5Forms.FormNumber name="venueCount" label={{ cs: "Počet hracích ploch" }} initialValue={data.venueCount ?? undefined} min={1} />
                <Uu5Forms.FormDate name="date" label={{ cs: "Datum" }} initialValue={data.date ?? undefined} />
                <Uu5Forms.FormText name="place" label={{ cs: "Místo" }} initialValue={data.place ?? undefined} />
                <Uu5Forms.FormTextArea name="desc" label={{ cs: "Popis" }} initialValue={data.desc ?? undefined} />
                <Uu5Forms.FormNumber name="groupCount" label={{ cs: "Počet skupin" }} initialValue={data.groupCount ?? undefined} min={1} />
                <Uu5Forms.FormNumber name="advanceFromGroup" label={{ cs: "Postup ze skupiny" }} initialValue={data.advanceFromGroup ?? undefined} min={1} />
                <OcAuth.FormIdentitySelect name="operativeList" label={{ cs: "Operátoři" }} initialValue={data.operativeList ?? undefined} multiple />
                <OcAuth.FormIdentitySelect name="refereeList" label={{ cs: "Rozhodčí" }} initialValue={data.refereeList ?? undefined} multiple />
              </Uu5Forms.Form.View>
            </Uu5Elements.Modal>
          </Uu5Forms.Form.Provider>
        )}

        <Uu5Elements.Dialog
          open={closeConfirmOpen}
          onClose={() => setCloseConfirmOpen(false)}
          header={<Lsi lsi={{ cs: "Uzavřít turnaj" }} />}
          icon={<Uu5Elements.Svg code="uugdssvg-svg-document-check" />}
          info={<Lsi lsi={{ cs: "Opravdu chcete uzavřít turnaj? Tato akce je nevratná a žádné další úpravy nebudou možné." }} />}
          actionDirection="horizontal"
          actionList={[
            {
              children: <Lsi lsi={{ cs: "Zrušit" }} />,
              onClick: () => setCloseConfirmOpen(false),
            },
            {
              children: <Lsi lsi={{ cs: "Uzavřít" }} />,
              colorScheme: "negative",
              significance: "highlighted",
              onClick: async () => {
                setCloseConfirmOpen(false);
                await handlerMap.close();
                handlerMap.load();
              },
            },
          ]}
        />
      </>
    );
  },
});

export default DetailSection;
