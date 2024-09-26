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
  const [expandedPlayerIndexA, setExpandedPlayerIndexA] = useState(null); // TeamAの拡大状態
  const [expandedPlayerIndexB, setExpandedPlayerIndexB] = useState(null); // TeamBの拡大状態
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

  const [selectedItems, setSelectedItems] = useState([]); // State to track selected items

  const handleItemClick = (item) => {
    if (selectedItems.includes(item)) {
      // Item is already selected: remove it
      const updatedItems = selectedItems.filter((i) => i !== item);
      setSelectedItems(updatedItems);
  
      // Reflect the real-time changes in icon-circles
      if (activeTeamPopup === "A") {
        const playerIndex = selectedIconA.playerIndex;
        const realTimeItems = selectedItemsA.map((playerItems, index) =>
          index === playerIndex ? updatedItems : playerItems
        );
        setSelectedItemsA(realTimeItems);
      } else {
        const playerIndex = selectedIconB.playerIndex;
        const realTimeItems = selectedItemsB.map((playerItems, index) =>
          index === playerIndex ? updatedItems : playerItems
        );
        setSelectedItemsB(realTimeItems);
      }
    } else if (selectedItems.length < 3) {
      // Item is not selected and there are fewer than 3 items selected
      const updatedItems = [...selectedItems, item];
      setSelectedItems(updatedItems);
  
      // Reflect the item selection in real-time
      if (activeTeamPopup === "A") {
        const playerIndex = selectedIconA.playerIndex;
        const realTimeItems = selectedItemsA.map((playerItems, index) =>
          index === playerIndex ? updatedItems : playerItems
        );
        setSelectedItemsA(realTimeItems);
      } else {
        const playerIndex = selectedIconB.playerIndex;
        const realTimeItems = selectedItemsB.map((playerItems, index) =>
          index === playerIndex ? updatedItems : playerItems
        );
        setSelectedItemsB(realTimeItems);
      }
  
      // Automatically confirm when 3 items are selected
      if (updatedItems.length === 3) {
        if (activeTeamPopup === "A") {
          handleItemSelect("A", updatedItems);
        } else {
          handleItemSelect("B", updatedItems);
        }
        setSelectedItems([]); // Reset after confirmation
      }
    }
  };

  const handleConfirmSelection = () => {
  if (selectedItems.length === 3) {
    if (activeTeamPopup === "A") {
      handleItemSelect("A", selectedItems);
    } else {
      handleItemSelect("B", selectedItems);
    }
    setSelectedItems([]); // Reset selected items after confirmation
  } else {
    alert("Please select exactly 3 items.");
  }
  };

  const [selectedBattleItemsA, setSelectedBattleItemsA] = useState(Array(5).fill(null)); // Array of 5 battle items for Team A
  const [selectedBattleItemsB, setSelectedBattleItemsB] = useState(Array(5).fill(null)); // Team B battle items

  // Handle selecting a battle item for a specific player
  const handleBattleItemSelect = (playerIndex, item, team) => {
    if (team === "A") {
      const updatedBattleItems = [...selectedBattleItemsA];
      updatedBattleItems[playerIndex] = item; // Update the selected item
      setSelectedBattleItemsA(updatedBattleItems);
      setPopupOpenIndex(null); // Close the popup
    } else if (team === "B") {
      const updatedBattleItems = [...selectedBattleItemsB];
      updatedBattleItems[playerIndex] = item; // Update the selected item
      setSelectedBattleItemsB(updatedBattleItems);
      setPopupOpenIndexB(null); // Close the popup
    }
  };

  const [popupOpenIndex, setPopupOpenIndex] = useState(null); // Track the open popup index
  const [popupOpenIndexB, setPopupOpenIndexB] = useState(null); // Track the open popup index for Team B

  // Handle opening and closing of popups for a specific player
  const handlePopupOpen = (team, playerIndex) => {
    if (team === "A") {
      setPopupOpenIndexB(null); // Close Team B's popup if it's open
      setPopupOpenIndex(playerIndex === popupOpenIndex ? null : playerIndex); // Toggle the popup for Team A
    } else if (team === "B") {
      setPopupOpenIndex(null); // Close Team A's popup if it's open
      setPopupOpenIndexB(playerIndex === popupOpenIndexB ? null : playerIndex); // Toggle the popup for Team B
    }
  };

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
        // Typing phase: add characters one by one
        if (displayTextRef.current.length < currentText.length) {
          displayTextRef.current += currentText.charAt(displayTextRef.current.length);
          setDisplayText(displayTextRef.current);
          typingRef.current = setTimeout(handleTyping, 100); // Typing speed
        }
      } else {
        // Backspacing phase: remove characters one by one
        if (displayTextRef.current.length > 0) {
          displayTextRef.current = displayTextRef.current.slice(0, -1);
          setDisplayText(displayTextRef.current);
          typingRef.current = setTimeout(handleTyping, 50); // Backspacing speed
        } else {
          // Once backspacing is done, start typing the new phase text
          setIsBackspacing(false);
        }
      }
    };
  
    handleTyping();
  
    return () => clearTimeout(typingRef.current);
  }, [isBackspacing, currentText]);

  useEffect(() => {
    if (currentTeam === teamA) {
      const currentPlayerIndex = teamA.picks.length;
      setExpandedPlayerIndexA(currentPlayerIndex);  // Team Aのプレイヤーを拡大
      setExpandedPlayerIndexB(null);  // Team Bの拡大状態をリセット
    } else {
      const currentPlayerIndex = teamB.picks.length;
      setExpandedPlayerIndexB(currentPlayerIndex);  // Team Bのプレイヤーを拡大
      setExpandedPlayerIndexA(null);  // Team Aの拡大状態をリセット
    }
  }, [draftIndex, currentTeam]);

  const getPhaseText = (teamName, action) => {
    if (action === "BAN") {
      return `${teamName} - 使用禁止ポケモンを選択中`; // Ban phase message
    } else if (action === "PICK") {
      const currentPlayerIndex = teamName === "Team A" ? teamA.picks.length : teamB.picks.length;
      const playerName = teamName === "Team A" 
        ? `Player ${currentPlayerIndex + 1}` // Player index for Team A
        : `Player ${currentPlayerIndex + 1}`; // Player index for Team B
      return `${teamName} ${playerName} - 使用ポケモンを選択中`; // Pick phase message
    }
    return ""; // Default case
  };
  
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
  const handleIconClick = (team, playerIndex) => {
    if (activeTeamPopup !== null) return; // Prevent multiple popups
    if (team === "A") {
      setSelectedIconA({ playerIndex });
      setActiveTeamPopup("A");
    } else {
      setSelectedIconB({ playerIndex });
      setActiveTeamPopup("B");
    }
  };

  // Handle item selection for both teams with validation to ensure no duplicates
  const handleItemSelect = (team, items) => {
    if (team === "A") {
      const updatedItems = selectedItemsA.map((playerItems, index) =>
        index === selectedIconA.playerIndex ? items : playerItems
      );
      setSelectedItemsA(updatedItems);
    } else {
      const updatedItems = selectedItemsB.map((playerItems, index) =>
        index === selectedIconB.playerIndex ? items : playerItems
      );
      setSelectedItemsB(updatedItems);
    }
    setActiveTeamPopup(null); // Close the popup automatically
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
      const team = default_draft[nextIndex][0];
      const action = default_draft[nextIndex][1];
      const teamName = team === teamA ? "Team A" : "Team B";
      const nextPhaseText = getPhaseText(teamName, action);
      
      setCurrentTeam(team);
      setCurrentAction(action);
      
      // ターンに応じてプレイヤーの拡大状態を更新
      if (team === teamA) {
        setExpandedPlayerIndexA(teamA.picks.length);
        setExpandedPlayerIndexB(null);
      } else {
        setExpandedPlayerIndexB(teamB.picks.length);
        setExpandedPlayerIndexA(null);
      }
      
      // タイプテキストの更新
      setIsBackspacing(true);
      setCurrentText(nextPhaseText);
    } else {
      // ドラフトが完了した場合の処理
      setDraftComplete(true);
      setCurrentText("ドラフトは完了しました。");
  
      // プレイヤーの拡大状態をリセット
      setExpandedPlayerIndexA(null);
      setExpandedPlayerIndexB(null);
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

  const BattleItemPopup = ({ onSelect }) => {
    const handleItemClick = (item) => {
      onSelect(item); // Trigger onSelect when an item is clicked
    };
  
  };
  
  const lanes = ["レーンを選択", "上ルート", "中央エリア", "下ルート"];
  const [selectedLanesA, setSelectedLanesA] = useState(Array(5).fill("レーンを選択"));
  const [selectedLanesB, setSelectedLanesB] = useState(Array(5).fill("レーンを選択"));

  const handleLaneSelect = (team, playerIndex, event) => {
    if (team === "A") {
      const updatedLanes = [...selectedLanesA];
      updatedLanes[playerIndex] = event.target.value;
      setSelectedLanesA(updatedLanes);
    } else if (team === "B") {
      const updatedLanes = [...selectedLanesB];
      updatedLanes[playerIndex] = event.target.value;
      setSelectedLanesB(updatedLanes);
    }
  };

  const [isPopupVisible, setIsPopupVisible] = useState(false); // マップポップアップの表示状態

  const handleMapButtonClick = () => {
    setIsPopupVisible(true); // マップボタンが押されたときにポップアップを表示
  };
  
  const handlePopupClose = () => {
    setIsPopupVisible(false); // ポップアップを閉じる
  };

  const lanePositionsTeamA = {
    "上ルート": { top: "30%", left: "20%" },
    "中央エリア": { top: "48%", left: "25%" },
    "下ルート": { top: "65%", left: "20%" },
  };
  
  const lanePositionsTeamB = {
    "上ルート": { top: "30%", right: "33%" },
    "中央エリア": { top: "48%", right: "38%" },
    "下ルート": { top: "65%", right: "33%" },
  };

  const renderCirclesForLanes = (selectedLanesA, selectedLanesB, teamA, teamB) => {
    const laneOffsets = {
      "上ルート": 0,
      "中央エリア": 0,
      "下ルート": 0,
    };
  
    return (
      <div>
        {/* Team A circles */}
        {selectedLanesA.map((lane, index) => {
          const lanePosition = lanePositionsTeamA[lane]; // Team Aのレーンポジション
          if (lanePosition) {
            // 重複した場合のオフセットを追加
            const offset = laneOffsets[lane] * 40; // オフセットを調整
            laneOffsets[lane] += 1; // 次のプレイヤーのオフセットを増やす
  
            const selectedPokemon = teamA.picks[index]; // Team Aのプレイヤーが選択したポケモン
            const playerImage = playerImagesA[index]; // プレイヤー画像
  
            return (
              <div
                key={`teamA-${index}`}
                className="lane-circleA"
                style={{ ...lanePosition, left: `calc(${lanePosition.left} + ${offset}px)` }} // オフセットを追加
              >
                <img
                  src={selectedPokemon ? selectedPokemon.imageUrl : playerImage} // 選択されたポケモンがある場合、その画像を表示
                  alt={selectedPokemon ? selectedPokemon.name.English : `Player ${index + 1}`}
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            );
          }
          return null;
        })}
  
        {/* Team B circles */}
        {Object.keys(laneOffsets).forEach(lane => laneOffsets[lane] = 0)}
  
        {selectedLanesB.map((lane, index) => {
          const lanePosition = lanePositionsTeamB[lane]; // Team Bのレーンポジション
          if (lanePosition) {
            // 重複した場合のオフセットを追加
            const offset = laneOffsets[lane] * 40; // オフセットを調整
            laneOffsets[lane] += 1; // 次のプレイヤーのオフセットを増やす
  
            const selectedPokemon = teamB.picks[index]; // Team Bのプレイヤーが選択したポケモン
            const playerImage = playerImagesB[index]; // プレイヤー画像
  
            return (
              <div
                key={`teamB-${index}`}
                className="lane-circleB"
                style={{ ...lanePosition, right: `calc(${lanePosition.right} + ${offset}px)` }} // オフセットを追加
              >
                <img
                  src={selectedPokemon ? selectedPokemon.imageUrl : playerImage} // 選択されたポケモンがある場合、その画像を表示
                  alt={selectedPokemon ? selectedPokemon.name.English : `Player ${index + 1}`}
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            );
          }
          return null;
        })}
      </div>
    );
  };

  return (
    <div className="container">
      {/* Header */}
      <div className="layout__header">
        <h1>
          {draftComplete
            ? "ドラフトは完了しました。"
            : displayText} {/* Just display `displayText` here */}
        </h1>
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
                className={`selectpokemon-teama ${
                  expandedPlayerIndexA === index ? "expand" : ""
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
              {/* Battle Item Circle for Team A */}
              <div className="battle-item-circle" onClick={() => handlePopupOpen("A",index)}>
                {selectedBattleItemsA[index] && (
                  <img
                    src={selectedBattleItemsA[index].imageUrl}
                    alt={selectedBattleItemsA[index].name}
                    className="battle-item-selected"
                  />
                )}
              </div>

              {/* Show the popup only for the currently selected player */}
              {popupOpenIndex === index && (
                <BattleItemPopup
                  onSelect={(item) => handleBattleItemSelect(index, item,"A")} // Handle battle item selection for that player
                />
              )}
              </div>
              
          {/* Player image */}
          <div className="playerpulldown-containerA">
                  <div className="player-imageA">
                    <img src={playerImagesA[index]} alt={`Player ${index + 1}`} />
                  </div>
                <select
                  value={selectedLanesA[index]} 
                  onChange={(event) => handleLaneSelect("A",index, event)}
                  className="lane-select-dropdown"  // 必要に応じてクラスを追加
                >
                  {lanes.map((lane, i) => (
                    <option key={i} value={lane}>
                      {lane}
                    </option>
                  ))}
                </select>
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
            <h2>Select 3 Held Items</h2>
            <div className="helditem-grid">
              {heldItems.map((item) => {
                const itemIndex = selectedItems.indexOf(item); // Get the item's index in the selectedItems array
                return (
                  <div key={item.id} className="helditem-option-container">
                    <img
                      src={item.imageUrl}
                      alt={item.name.English}
                      className={`helditem-option ${itemIndex !== -1 ? "selected" : ""}`}
                      onClick={() => handleItemClick(item)}
                    />
                    {itemIndex !== -1 && (
                      <div className="selected-number">
                        {itemIndex + 1} {/* Display the selection order */}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {popupOpenIndex !== null && (
        <div className="battleitem-overlay">
          <div className="battleitem-popup">
            <div className="battleitem-grid">
              {battleItems.map((item) => (
                <img
                  key={item.id}
                  src={item.imageUrl}
                  alt={item.name}
                  className="battleitem-option"
                  onClick={() => handleBattleItemSelect(popupOpenIndex, item, "A")} // Handle battle item selection
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {popupOpenIndexB !== null && (
        <div className="battleitem-overlay">
          <div className="battleitem-popup">
            <div className="battleitem-grid">
              {battleItems.map((item) => (
                <img
                  key={item.id}
                  src={item.imageUrl}
                  alt={item.name}
                  className="battleitem-option"
                  onClick={() => handleBattleItemSelect(popupOpenIndexB, item, "B")} // Handle battle item selection for Team B
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {isPopupVisible && (
        <div className="popup-overlay">
          <div className="lane-selection-popup">
            <img src={`${process.env.PUBLIC_URL}/Theia_Sky_Ruins.png`} alt="Theia Sky Ruins Map" />
            {/* Draw circles based on lane selection */}
            {renderCirclesForLanes(selectedLanesA, selectedLanesB, teamA, teamB)}
            <button className="confirm-button" onClick={handlePopupClose}>
              閉じる
            </button>
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
                className={`selectpokemon-teamb ${
                  expandedPlayerIndexB === index ? "expand" : ""
                }`} // Apply the 'expand' class if it's the player's turn
              >
                <div className="playerpulldown-containerB">
                  <div className="player-imageB">
                    <img src={playerImagesB[index]} alt={`Player ${index + 1}`} />
                  </div>
                <select
                  value={selectedLanesB[index]} 
                  onChange={(event) => handleLaneSelect("B",index, event)}
                  className="lane-select-dropdown"  // 必要に応じてクラスを追加
                >
                  {lanes.map((lane, i) => (
                    <option key={i} value={lane}>
                      {lane}
                    </option>
                  ))}
                </select>
                </div>

                <div className="icon-containerB">
                  {/* Battle Item Circle for Team B */}
                  <div className="battle-item-circle" onClick={() => handlePopupOpen("B", index)}>
                    {selectedBattleItemsB[index] && (
                  <img
                    src={selectedBattleItemsB[index].imageUrl}
                    alt={selectedBattleItemsB[index].name}
                    className="battle-item-selected"
                  />
                    )}
                  </div>

                  {/* Show the popup only for the currently selected player */}
                  {popupOpenIndexB === index && (
                    <BattleItemPopup
                      onSelect={(item) => handleBattleItemSelect(index, item, "B")} // Handle battle item selection for that player
                    />
                  )}
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
        <button className="map-button" onClick={handleMapButtonClick}>
          マップ
        </button>
        <button 
          onClick={handleConfirmClick} 
          disabled={!selectedPokemon}
          className={`confirm-button ${currentAction === "BAN" ? "ban-button" : "pick-button"}`}>
          {currentAction === "BAN" ? "BAN" : "PICK"}
        </button>
      </div>
    </div>
  );
};

export default App;
