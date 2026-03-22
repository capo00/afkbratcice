import { createVisualComponent, Lsi, useScreenSize, Utils } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "./config/config.js";
import OcAuth from "../../libs/oc_cli-auth";
import { useTournament } from "./tournament-context.js";

const DetailBasicInfo = createVisualComponent({
  uu5Tag: Config.TAG + "Tournament.Detail.BasicInfo",

  render(props) {
    const { isAuth, isOperator, direction = "vertical", ...restProps } = props;

    const [screenSize] = useScreenSize();
    const isSmall = screenSize === "xs";

    const tournamentDto = useTournament();

    const { data } = tournamentDto;

    const isCreated = data.state === "created";

    const infoList = [
      {
        icon: Config.STATE_MAP[data.state]?.icon,
        colorScheme: Config.STATE_MAP[data.state]?.colorScheme,
        significance: "highlighted",
        title: Config.STATE_MAP[data.state]?.children,
        subtitle: data.type ? Config.TYPE_MAP[data.type]?.children || data.type : "-"
      }
    ];

    if (isSmall && false) {
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
      <div {...Utils.VisualComponent.getAttrs(restProps)}>
        <Uu5Elements.InfoGroup itemList={infoList} direction={direction} size="xl" />

        {data.desc && isCreated && <><Uu5Elements.Line significance="subdued" margin={{ top: 16, bottom: 16 }} />{data.desc}</>}
        {data.refereeList?.length > 0 && isCreated && (
          <>
            <Uu5Elements.Line significance="subdued" margin={{ top: 16, bottom: 16 }} />
            <div className={Config.Css.css({ display: "flex", gap: 8 })}>
              {data.refereeList.map((item) => <OcAuth.IdentityItem key={item} identity={item} subtitle={<Lsi lsi={{ cs: "Rozhodčí" }} />} size="xl" />)}
            </div>
          </>
        )}
      </div>
    );
  },
});

export default DetailBasicInfo;
