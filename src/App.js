import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import { heldItems } from "./data/heldItems";
import { pokemonList } from "./data/pokemonList";
import { battleItems} from "./data/battleItems";

class Team {
  constructor(name) {
    this.name = name;
    this.bans = [];
    this.picks = [];
  }

  ban(pokemon) {
    this.bans.push(pokemon);
  }

  pick(pokemon) {
    if (this.picks.length < 5) {
      this.picks.push(pokemon);
    }
  }
}

const teamA = new Team("Team A");
const teamB = new Team("Team B");

// Initial player names
const initialPlayerNamesA = [
  "Player 1",
  "Player 2",
  "Player 3",
  "Player 4",
  "Player 5",
];
const initialPlayerNamesB = [
  "Player 1",
  "Player 2",
  "Player 3",
  "Player 4",
  "Player 5",
];

// Draft order
const default_draft = [
  [teamA, "BAN"],
  [teamB, "BAN"],
  [teamA, "BAN"],
  [teamB, "BAN"],
  [teamA, "PICK"],
  [teamB, "PICK"],
  [teamB, "PICK"],
  [teamA, "PICK"],
  [teamA, "PICK"],
  [teamB, "PICK"],
  [teamB, "PICK"],
  [teamA, "PICK"],
  [teamA, "PICK"],
  [teamB, "PICK"],
];

const banOrderA = [1, 3]; // Team A's ban positions
const banOrderB = [2, 4]; // Team A's ban positions
const pickOrderA = [1, 4, 5, 8, 9]; // Team A's pick positions
const pickOrderB = [2, 3, 6, 7, 10]; // Team B's pick positions

// Main component
const App = () => {
  const [selectedType, setSelectedType] = useState("すべて");
  const [currentTeam, setCurrentTeam] = useState(default_draft[0][0]);
  const [currentAction, setCurrentAction] = useState(default_draft[0][1]);
  const [bans, setBans] = useState([]);
  const [picks, setPicks] = useState([]);
  const [draftIndex, setDraftIndex] = useState(0);
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [userInteracted, setUserInteracted] = useState(false);
  const [draftComplete, setDraftComplete] = useState(false);
  const [playerNamesA, setPlayerNamesA] = useState(initialPlayerNamesA);
  const [playerNamesB, setPlayerNamesB] = useState(initialPlayerNamesB);
  const [displayText, setDisplayText] = useState(""); // For animated text
  const displayTextRef = useRef(""); // Track the current displayed text
  const typingRef = useRef(null); // Ref for typing timeout
  const [isBackspacing, setIsBackspacing] = useState(false); // Track if backspacing is happening
  const [currentText, setCurrentText] = useState(""); // Track the full text of the current phase
  const [expandedPlayerIndex, setExpandedPlayerIndex] = useState(null); // Track the current player index

  const [selectedIconA, setSelectedIconA] = useState({
    playerIndex: null,
    iconIndex: null,
  });
  const [selectedItemsA, setSelectedItemsA] = useState(
    Array(5).fill(Array(3).fill(null))
  ); // Team A
  const [selectedIconB, setSelectedIconB] = useState({
    playerIndex: null,
    iconIndex: null,
  });
  const [selectedItemsB, setSelectedItemsB] = useState(
    Array(5).fill(Array(3).fill(null))
  ); // Team B

  const [activeTeamPopup, setActiveTeamPopup] = useState(null); // "A" or "B" or null

  const banSound = useRef(new Audio("/決定ボタンを押す52.mp3"));
  const crySound = useRef(null);

  useEffect(() => {
    const preloadAudio = async () => {
      banSound.current = new Audio("/決定ボタンを押す52.mp3");
      const pokemonCries = pokemonList.map((pokemon) => {
        const audio = new Audio(`/${pokemon.name.English.toLowerCase()}.mp3`);
        return audio;
      });
      crySound.current = pokemonCries;
    };

    preloadAudio();
  }, []);

  useEffect(() => {
    const handleUserInteraction = () => {
      setUserInteracted(true);
      document.removeEventListener("click", handleUserInteraction);
    };

    document.addEventListener("click", handleUserInteraction);

    return () => {
      document.removeEventListener("click", handleUserInteraction);
    };
  }, []);

  useEffect(() => {
    const handleTyping = () => {
      if (!isBackspacing) {
        // Typing phase
        if (displayTextRef.current.length < currentText.length) {
          // Add characters one by one
          displayTextRef.current += currentText.charAt(
            displayTextRef.current.length
          );
          setDisplayText(displayTextRef.current);
          typingRef.current = setTimeout(handleTyping, 150); // Typing speed
        }
      } else {
        // Backspacing phase
        if (displayTextRef.current.length > 0) {
          // Remove characters one by one
          displayTextRef.current = displayTextRef.current.slice(0, -1);
          setDisplayText(displayTextRef.current);
          typingRef.current = setTimeout(handleTyping, 100); // Backspacing speed
        } else {
          // Once backspacing is done, start typing the new phase text
          setIsBackspacing(false);
        }
      }
    };

    handleTyping();

    return () => clearTimeout(typingRef.current);
  }, [isBackspacing, currentText]);

  //タイプ変更
  const handleTypeChange = (event) => {
    setSelectedType(event.target.value);
  };

  //ポケモン絞り込み
  const filteredPokemonList =
    selectedType === "すべて"
      ? pokemonList
      : pokemonList.filter((p) => p.type === selectedType);

  const handlePokemonClick = (pokemon) => {
    if (draftComplete || isPokemonDisabled(pokemon)) {
      return;
    }
    setSelectedPokemon(pokemon);

    if (currentAction === "PICK") {
      crySound.current = new Audio(
        `/${pokemon.name.English.toLowerCase()}.mp3`
      );
    }
  };

  // Handle icon click for both teams
  const handleIconClick = (team, playerIndex, iconIndex) => {
    if (activeTeamPopup !== null) {
      // If a popup is already active, don't allow another one to open
      return;
    }
    if (team === "A") {
      setSelectedIconA({ playerIndex, iconIndex });
      setActiveTeamPopup("A"); // Open Team A's popup
    } else {
      setSelectedIconB({ playerIndex, iconIndex });
      setActiveTeamPopup("B"); // Open Team B's popup
    }
  };

  // Handle item selection for both teams
  const handleItemSelect = (team, item) => {
    if (team === "A") {
      const updatedItems = selectedItemsA.map((playerItems, index) =>
        index === selectedIconA.playerIndex
          ? playerItems.map((icon, i) =>
              i === selectedIconA.iconIndex ? item : icon
            )
          : playerItems
      );
      setSelectedItemsA(updatedItems);
    } else {
      const updatedItems = selectedItemsB.map((playerItems, index) =>
        index === selectedIconB.playerIndex
          ? playerItems.map((icon, i) =>
              i === selectedIconB.iconIndex ? item : icon
            )
          : playerItems
      );
      setSelectedItemsB(updatedItems);
    }
    setActiveTeamPopup(null);
  };

  const handleConfirmClick = () => {
    if (selectedPokemon) {
      if (userInteracted) {
        if (currentAction === "BAN") {
          banSound.current.play().catch((error) => {
            console.error("Error playing sound:", error);
          });
        } else if (currentAction === "PICK" && crySound.current) {
          crySound.current.play().catch((error) => {
            console.error("Error playing sound:", error);
          });
        }
      }
      if (currentAction === "BAN") {
        currentTeam.ban(selectedPokemon);
        setBans([...bans, selectedPokemon]);
      } else if (currentAction === "PICK") {
        currentTeam.pick(selectedPokemon);
        setPicks([...picks, selectedPokemon]);
      }
      updateDraft(1);
      setSelectedPokemon(null);
    }
  };

  const updateDraft = (step) => {
    const nextIndex = draftIndex + step;
    if (nextIndex >= 0 && nextIndex < default_draft.length) {
      setDraftIndex(nextIndex);
      setCurrentTeam(default_draft[nextIndex][0]);
      setCurrentAction(default_draft[nextIndex][1]);
    } else {
      setDraftComplete(true);
    }
  };

  const isPokemonDisabled = (pokemon) => {
    if (bans.includes(pokemon) || picks.includes(pokemon)) {
      return true;
    }
    const ismewtwoy = pokemon.name.English === "mewtwoy";
    const ismewtwox = pokemon.name.English === "mewtwox";
    const ismewtwoySelected =
      bans.some((p) => p.name.English === "mewtwoy") ||
      picks.some((p) => p.name.English === "mewtwoy");
    const ismewtwoxSelected =
      bans.some((p) => p.name.English === "mewtwox") ||
      picks.some((p) => p.name.English === "mewtwox");
    return (ismewtwoy && ismewtwoxSelected) || (ismewtwox && ismewtwoySelected);
  };

  const handleUndoClick = () => {
    if (draftIndex > 0) {
      updateDraft(-1);
      const lastAction = default_draft[draftIndex - 1];
      const lastTeam = lastAction[0];
      const lastActionType = lastAction[1];

      if (lastActionType === "BAN") {
        lastTeam.bans.pop();
        setBans([...bans.slice(0, -1)]);
      } else if (lastActionType === "PICK") {
        lastTeam.picks.pop();
        setPicks([...picks.slice(0, -1)]);
      }
    }
  };

  const handleResetClick = () => {
    setBans([]);
    setPicks([]);
    teamA.bans = [];
    teamA.picks = [];
    teamB.bans = [];
    teamB.picks = [];
    setDraftIndex(0);
    setCurrentTeam(default_draft[0][0]);
    setCurrentAction(default_draft[0][1]);
    setDraftComplete(false);
  };

  const playerImagesA = [
    process.env.PUBLIC_URL + "/red.png",
    process.env.PUBLIC_URL + "/hibiki.png",
    process.env.PUBLIC_URL + "/yuuki.png",
    process.env.PUBLIC_URL + "/koki.png",
    process.env.PUBLIC_URL + "/toya.png",
    // Add paths for other players
  ];

  const playerImagesB = [
    process.env.PUBLIC_URL + "/green.png",
    process.env.PUBLIC_URL + "/silver.png",
    process.env.PUBLIC_URL + "/haruka.png",
    process.env.PUBLIC_URL + "/jun.png",
    process.env.PUBLIC_URL + "/chelen.png",
    // Add paths for other players
  ];

  const [selectedBattleItem, setSelectedBattleItem] = useState(null);
  const BattleItemPopup = ({ onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleIconClick = () => {
      setIsOpen(!isOpen); // Toggle popup
    };

    const handleItemClick = (item) => {
      onSelect(item);
      setIsOpen(false); // Close popup after selecting
    };

    return (
      <div className="battle-item-container">
        <div className="battle-item-circle" onClick={handleIconClick}>
          {/* Circle for battle items */}
        </div>

        {isOpen && (
          <div className="battle-item-popup">
            {battleItems.map((item, index) => (
              <img
                key={index}
                src={item.imageUrl}
                alt={item.name}
                className="battle-item-image"
                onClick={() => handleItemClick(item)}
              />
            ))}
          </div>
        )}
      </div>
    );
  };


  return (
    <div className="container">
      {/* Header */}
      <div className="layout__header">
        <h3>
          {draftComplete
            ? "ドラフトは完了しました。"
            : `現在のフェーズ: ${displayText}`}
        </h3>
        <div className="dropdown">
          <select onChange={handleTypeChange} value={selectedType}>
            <option value="すべて">すべて</option>
            <option value="ディフェンス">ディフェンス</option>
            <option value="サポート">サポート</option>
            <option value="バランス">バランス</option>
            <option value="アタック">アタック</option>
            <option value="スピード">スピード</option>
          </select>
        </div>
      </div>

      {/* Side Navi 1 - Team A */}
      <div className="layout__sideNavi1">
        {/* Team A Ban Section */}
        <div className="teama-ban">
          {Array(2)
            .fill(null)
            .map((_, index) => (
              <div key={index} className="ban-pokemon-image-container">
                {teamA.bans[index] ? (
                  <img
                    src={teamA.bans[index].imageUrl}
                    alt={teamA.bans[index].name.English}
                    className="ban-preview-image"
                  />
                ) : currentTeam === teamA &&
                  currentAction === "BAN" &&
                  selectedPokemon &&
                  index === teamA.bans.length ? (
                  <img
                    src={selectedPokemon.imageUrl}
                    alt={selectedPokemon.name.English}
                    className="ban-preview-image"
                  />
                ) : (
                  <span>{banOrderA[index]}</span> /* Display ban draft number */
                )}
              </div>
            ))}
        </div>

        {/* Team A Pick Section */}
        <div className="teama-pick">
          {Array(5)
            .fill(null)
            .map((_, index) => (
              <div
                key={index}
                className={`select pokemon ${
                  expandedPlayerIndex === index ? "expand" : ""
                }`} // Apply the 'expand' class if it's the player's turn
              >
                          <div className="pick-pokemon-image-container">
            {teamA.picks[index] ? (
              <img
                src={teamA.picks[index].imageUrl}
                alt={teamA.picks[index].name.English}
                className="pick-preview-image"
              />
            ) : currentTeam === teamA &&
              currentAction === "PICK" &&
              selectedPokemon &&
              index === teamA.picks.length ? (
              <img
                src={selectedPokemon.imageUrl}
                alt={selectedPokemon.name.English}
                className="pick-preview-image"
              />
            ) : (
              <span>{pickOrderA[index]}</span> /* Display pick draft number */
            )}
          </div>

          <div className="icon-container">
            {Array(3)
              .fill(null)
              .map((_, iconIndex) => (
                <div
                  key={iconIndex}
                  className="icon"
                  onClick={() => handleIconClick("A", index, iconIndex)}
                >
                  <div className="icon-circle">
                    {selectedItemsA[index][iconIndex] && (
                      <img
                        src={selectedItemsA[index][iconIndex].imageUrl}
                        alt={selectedItemsA[index][iconIndex].name.English}
                      />
                    )}
                  </div>
                </div>
              ))}
          </div>

          {/* BattleItemPopup and selected battle item */}
          <div className="battle-item-section">
            <BattleItemPopup onSelect={(item) => setSelectedBattleItem(item)} />
            <div className="battle-item-display">
              {selectedBattleItem && (
                <img
                  src={selectedBattleItem.imageUrl}
                  alt={selectedBattleItem.name}
                  className="battle-item-selected"
                />
              )}
            </div>
          </div>

          {/* Player image */}
          <div className="player-imageA">
            <img src={playerImagesA[index]} alt={`Player ${index + 1}`} />
          </div>
        </div>
      ))}
  </div>
</div>

      {/* Main Content */}
      <div className="layout__mainContent">
        <div className="pokemon-selection">
          {filteredPokemonList.map((pokemon) => (
            <img
              key={pokemon.id}
              src={pokemon.imageUrl}
              alt={pokemon.name.English}
              onClick={() => handlePokemonClick(pokemon)}
              style={{
                opacity:
                  bans.includes(pokemon) ||
                  picks.includes(pokemon) ||
                  isPokemonDisabled(pokemon)
                    ? 0.3
                    : 1,
              }}
            />
          ))}
        </div>
      </div>

      {/* Popup Overlay */}
      {activeTeamPopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            {heldItems.map((item, index) => (
              <div
                key={index}
                className="popup-item"
                onClick={() => handleItemSelect(activeTeamPopup, item)}
              >
                <img src={item.imageUrl} alt={item.name.English} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Side Navi 2 - Team B */}
      <div className="layout__sideNavi2">
        {/* Team B Ban Section */}
        <div className="teamb-ban">
          {Array(2)
            .fill(null)
            .map((_, index) => (
              <div key={index} className="ban-pokemon-image-container">
                {teamB.bans[index] ? (
                  <img
                    src={teamB.bans[index].imageUrl}
                    alt={teamB.bans[index].name.English}
                    className="ban-preview-image"
                  />
                ) : currentTeam === teamB &&
                  currentAction === "BAN" &&
                  selectedPokemon &&
                  index === teamB.bans.length ? (
                  <img
                    src={selectedPokemon.imageUrl}
                    alt={selectedPokemon.name.English}
                    className="ban-preview-image"
                  />
                ) : (
                  <span>{banOrderB[index]}</span> /* Display ban draft number */
                )}
              </div>
            ))}
        </div>

        {/* Team B Pick Section */}
        <div className="teamb-pick">
          {Array(5)
            .fill(null)
            .map((_, index) => (
              <div
                key={index}
                className={`select pokemon ${
                  expandedPlayerIndex === index ? "expand" : ""
                }`} // Apply the 'expand' class if it's the player's turn
              >
                <div className="player-imageB">
                  <img src={playerImagesB[index]} alt={`Player ${index + 1}`} />
                </div>

                <div className="icon-containerB">
                  {Array(3)
                    .fill(null)
                    .map((_, iconIndex) => (
                      <div
                        key={iconIndex}
                        className="icon"
                        onClick={() => handleIconClick("B", index, iconIndex)}
                      >
                        <div className="icon-circle">
                          {selectedItemsB[index][iconIndex] && (
                            <img
                              src={selectedItemsB[index][iconIndex].imageUrl}
                              alt={
                                selectedItemsB[index][iconIndex].name.English
                              }
                            />
                          )}
                        </div>
                      </div>
                    ))}
                </div>

                <div className="pick-pokemon-image-container">
                  {teamB.picks[index] ? (
                    <img
                      src={teamB.picks[index].imageUrl}
                      alt={teamB.picks[index].name.English}
                      className="pick-preview-image"
                    />
                  ) : currentTeam === teamB &&
                    currentAction === "PICK" &&
                    selectedPokemon &&
                    index === teamB.picks.length ? (
                    <img
                      src={selectedPokemon.imageUrl}
                      alt={selectedPokemon.name.English}
                      className="pick-preview-image"
                    />
                  ) : (
                    <span>
                      {pickOrderB[index]}
                    </span> /* Display pick draft number */
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Footer */}
      <div className="layout__footer">
        <button onClick={handleConfirmClick} disabled={!selectedPokemon}>
          決定
        </button>
      </div>
    </div>
  );
};

export default App;
