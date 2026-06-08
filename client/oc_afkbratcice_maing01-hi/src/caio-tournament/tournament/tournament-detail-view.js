import { createVisualComponent, Lsi, useScreenSize, Utils, useState, useEffect } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Extras from "uu5extrasg01";
import Config from "./config/config.js";
import OcAuth from "../../libs/oc_cli-auth";
import ParticipantSection from "../participant/participant-section.js";
import PlayoffSection from "../components/playoff-section.js";
import { useTournament } from "./tournament-context.js";
import { useParticipantList } from "../participant/participant-context.js";
import DetailBasicInfo from "./detail-basic-info.js";
import GroupMatchesSection from "../group/group-matches-section.js";
import FinalStandings from "./final-standings.js";
import DetailSection from "./detail-section.js";

function isAuthoritiesProfile(identity) {
  return identity?.profileList?.includes("authorities");
}

function isOperative(data, identity) {
  if (!identity) return false;
  if (isAuthoritiesProfile(identity)) return true;
  return data?.operativeList?.includes(identity.identity);
}

function isReferee(data, identity) {
  if (!identity) return false;
  if (isOperative(data, identity)) return true;
  return data?.refereeList?.includes(identity.identity);
}

function getGroupList(count) {
  const list = [];
  for (let i = 0; i < (count || 1); i++) {
    list.push(String.fromCharCode(65 + i));
  }
  return list;
}

function getVenueList(count) {
  const list = [];
  for (let i = 0; i < (count || 1); i++) {
    list.push(i + 1);
  }
  return list;
}

function ReloadTimer({ nextReloadTime, ...restProps }) {
  function actualValue(nextTime) {
    const now = new Date().getTime();
    const diffMs = nextTime - now;
    return Math.round(diffMs / 1000);
  }

  const [value, setValue] = useState(() => actualValue(nextReloadTime));

  useEffect(() => {
    const interval = setInterval(() => setValue((prev) => prev - 1 === -1 ? 59 : prev - 1), 1000);
    return () => {
      clearInterval(interval);
      setValue(0);
    };
  }, [nextReloadTime]);

  return (
    <Uu5Elements.Progress 
      {...restProps}
      value={100 - Math.round(value / 60 * 100)}
      type="horizontal"
      size="xxs"
      width="100%"
    />
  );
}

const TournamentDetailView = createVisualComponent({
  uu5Tag: Config.TAG + "TournamentDetailView",

  render(props) {
    const { id, nextReloadTime, ...restProps } = props;
    const session = OcAuth.useSession();

    const [screenSize] = useScreenSize();
    const isMinM = ["m", "l", "xl"].includes(screenSize);

    const dto = useTournament();
    const participantList = useParticipantList();

    if (dto.state === "pendingNoData") {
      return <Uu5Elements.Pending {...restProps} size="max" />;
    }

    if (dto.state === "errorNoData") {
      return (
        <Uu5Elements.PlaceholderBox
          {...restProps}
          className={Utils.Css.joinClassName(Config.Css.css({ marginBlockStart: 120 }), restProps.className)}
          code="error"
          header={<Lsi lsi={{ cs: "Turnaj nenalezen" }} />}
          info={<Lsi lsi={{ cs: "Turnaj s ID %s nebyl nalezen." }} params={[id]} />}
          nestingLevel="area"
        />
      );
    }

    const { data } = dto;
    const isAuth = isAuthoritiesProfile(session.identity);
    const isOperator = isOperative(data, session.identity);
    const canRef = isReferee(data, session.identity);
    const isCreated = data.state === "created";
    const isGroup = data.state === "group";
    const isPlayOff = data.state === "playoff";
    const isCompleted = data.state === "completed";
    const isFinal = data.state === "final";
    const showCollapsedGroups = isPlayOff || isCompleted || isFinal;
    const showCollapsedPlayoff = isCompleted || isFinal;
    const showFinalStandings = isCompleted || isFinal;

    const groupList = getGroupList(data.groupCount);
    const venueList = getVenueList(data.venueCount ?? 1); // one venue is default

    let qrCode, basicInfo;
    if (isMinM) {
      let basicInfoClassName;
      if (!isOperator) {
        qrCode = (
          <Uu5Extras.QRCode
            value={location.href}
            size={screenSize === "m" ? "s" : "m"}
          />
        );
        basicInfoClassName = Config.Css.css({ marginBlockStart: 24 });
      }

      basicInfo = <DetailBasicInfo isAuth={isAuth} isOperator={isOperator} className={basicInfoClassName} nextReloadTime={nextReloadTime} />;
    }

    return (
      <>
        {!basicInfo && nextReloadTime && <ReloadTimer nextReloadTime={nextReloadTime} className={Config.Css.css({
          position: "fixed",
          top: 0,
          zIndex: 2000,
          left: 0,
          height: "auto",
          "& > div": {
            borderRadius: 0,
          },
        })} />}
        <Uu5Elements.Grid
          {...restProps}
          templateColumns={{ xs: "1fr", m: "1fr 156px", l: "1fr 252px" }}
          templateAreas={{ xs: "main", m: "main sidebar" }}
          columnGap={24}
        >
          <DetailSection isAuth={isAuth} isOperator={isOperator} className={Config.Css.css({ gridArea: "main" })}>
            {!basicInfo && <DetailBasicInfo isAuth={isAuth} isOperator={isOperator} nextReloadTime={nextReloadTime} />}

            {(isCreated && (isOperator || participantList.data?.length > 0)) && (
              <ParticipantSection
                className={Config.Css.css({ marginBlockStart: 24 })}
                groupList={groupList}
                isOperator={isOperator}
              />
            )}

            {isGroup && (
              <GroupMatchesSection
                className={Config.Css.css({ marginBlockStart: 24 })}
                tournamentId={id}
                venueList={venueList}
                groupList={groupList}
                isReferee={canRef}
              />
            )}

            {isPlayOff && (
              <PlayoffSection
                className={Config.Css.css({ marginBlockStart: 24 })}
                tournamentId={id}
                venueList={venueList}
                isReferee={canRef}
              />
            )}

            {showFinalStandings && data.finalStandingList?.length > 0 && (
              <FinalStandings
                className={Config.Css.css({ marginBlockStart: 24 })}
                tournamentId={id}
              />
            )}

            {showCollapsedPlayoff && (
              <PlayoffSection
                className={Config.Css.css({ marginBlockStart: 24 })}
                tournamentId={id}
                venueList={venueList}
                collapsed
              />
            )}

            {showCollapsedGroups && (
              <GroupMatchesSection
                className={Config.Css.css({ marginBlockStart: 24 })}
                tournamentId={id}
                venueList={venueList}
                groupList={groupList}
                collapsed
              />
            )}
          </DetailSection >
          {basicInfo && (
            <div className={Config.Css.css({ gridArea: "sidebar" })}>
              {nextReloadTime && <ReloadTimer nextReloadTime={nextReloadTime} />}
              {qrCode}
              {basicInfo}
            </div>
          )}
        </Uu5Elements.Grid>
      </>
    );
  },
});

export { TournamentDetailView };
export default TournamentDetailView;
