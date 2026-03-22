import { createVisualComponent, Lsi, useScreenSize } from "uu5g05";
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

const TournamentDetailView = createVisualComponent({
  uu5Tag: Config.TAG + "TournamentDetailView",

  render(props) {
    const { id } = props;
    const session = OcAuth.useSession();

    const [screenSize] = useScreenSize();
    const isSmall = screenSize === "xs";

    const dto = useTournament();
    const participantList = useParticipantList();

    if (dto.state === "pendingNoData") {
      return <Uu5Elements.Pending size="xl" />;
    }

    if (dto.state === "errorNoData") {
      return (
        <Uu5Elements.PlaceholderBox
          className={Config.Css.css({ marginBlockStart: 120 })}
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
    const venueList = getVenueList(data.venueCount ?? 2);

    let basicInfo = <DetailBasicInfo isAuth={isAuth} isOperator={isOperator} />;
    if (!isOperator && !isSmall) {
      basicInfo = (
        <Uu5Elements.Grid templateColumns="1fr 252px" columnGap={24}>
          {basicInfo}
          <Uu5Extras.QRCode value={`${location.href}`} size="m" className={Config.Css.css({ alignSelf: "end" })} />
        </Uu5Elements.Grid>
      );
    }

    return (
      <>
        {basicInfo}

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

        {showFinalStandings && data.finalStandings?.length > 0 && false && (
          <div className={Config.Css.css({ marginBlockStart: 24 })}>
            <Uu5Elements.Block headerType="heading" header={<Lsi lsi={{ cs: "Celkové umístění" }} />}>
              <table className={Config.Css.css({ width: "100%", borderCollapse: "collapse", "& th, & td": { padding: "6px 10px", borderBottom: "1px solid #ddd", textAlign: "left" } })}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th><Lsi lsi={{ cs: "Název" }} /></th>
                  </tr>
                </thead>
                <tbody>
                  {data.finalStandings.map((s, idx) => (
                    <tr key={s.participantId || idx}>
                      <td>{s.shared ? `${s.position}.–` : `${s.position}.`}</td>
                      <td>{s.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Uu5Elements.Block>
          </div>
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
      </>
    );
  },
});

export { TournamentDetailView };
export default TournamentDetailView;
