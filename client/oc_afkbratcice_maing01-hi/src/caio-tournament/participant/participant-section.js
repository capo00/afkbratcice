import { createVisualComponent } from "uu5g05";
import Config from "./config/config.js";
import ParticipantSectionReadOnly from "./participant-section-read-only.js";
import ParticipantSectionEdit from "./participant-section-edit.js";

const ParticipantSection = createVisualComponent({
  uu5Tag: Config.TAG + "ParticipantSection",

  render(props) {
    const { isOperator, ...restProps } = props;

    return (
      isOperator ? <ParticipantSectionEdit {...restProps} /> : <ParticipantSectionReadOnly {...restProps} />
    );
  },
});

export { ParticipantSection };
export default ParticipantSection;
