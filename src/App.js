import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import { heldItems } from "./data/heldItems";
import { pokemonList } from "./data/pokemonList";
import { battleItems } from "./data/battleItems";
import { defaultHeldItems } from './data/defaultHeldItems';

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
  ["", "COMPLETE"]  // Add this phase for draft completion
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
  const [draftComplete, setDraftComplete] = useState(false);
  const [displayText, setDisplayText] = useState(""); // For animated text
  const displayTextRef = useRef(""); // Track the current displayed text
  const typingRef = useRef(null); // Ref for typing timeout
  const [isBackspacing, setIsBackspacing] = useState(false); // Track if backspacing is happening
  const [currentText, setCurrentText] = useState(""); // Track the full text of the current phase
  const [expandedPlayerIndexA, setExpandedPlayerIndexA] = useState(null); // TeamAの拡大状態
  const [expandedPlayerIndexB, setExpandedPlayerIndexB] = useState(null); // TeamBの拡大状態
  const [searchQuery, setSearchQuery] = useState(""); // New search input state
  const [historyIndex, setHistoryIndex] = useState(0); // Track the history for forward/backward navigation
  const [history, setHistory] = useState([]); // Track all actions (ban/pick history)
  const [bgm, setBgm] = useState(null); // BGM audio state
  const [bgmVolume, setBgmVolume] = useState(0.5); // BGM volume state
  const [cryVolume, setCryVolume] = useState(0.5); // Cry volume state
  const [userInteracted, setUserInteracted] = useState(false); // Track if user interacted

  useEffect(() => {
    const banBgm = new Audio("/42 最後の道.mp3");
    const pickBgm = new Audio("/43 ラストバトル（ＶＳライバル）.mp3");
  
    if (userInteracted) {
      if (bgm) {
        bgm.pause(); // Stop the current BGM if one is playing
      }
  
      if (currentAction === "BAN") {
        setBgm(banBgm);
      } else if (currentAction === "PICK") {
        setBgm(pickBgm);
      }
    }
  }, [currentAction, userInteracted]);
  
  // Set volume and play BGM once user interacts
  useEffect(() => {
    if (userInteracted && bgm) {
      bgm.volume = bgmVolume;
      bgm.play().catch((error) => {
        console.error("Error playing audio:", error);
      });
    }
  }, [bgm, bgmVolume, userInteracted]);
  
  // Handle volume change
  const handleVolumeChange = (event) => {
    const newVolume = event.target.value / 100;
    setBgmVolume(newVolume); // Adjust BGM volume
    setCryVolume(newVolume); // Adjust Pokémon cry volume
  };

  const handleUndoClick = () => {
    if (historyIndex > 0) {
      const previousAction = history[historyIndex - 1];
      const previousTeam = previousAction.team;
      const previousActionType = previousAction.action;

      // Revert the last action
      if (previousActionType === "BAN") {
        previousTeam.bans.pop();
        setBans([...previousTeam.bans]);
      } else if (previousActionType === "PICK") {
        previousTeam.picks.pop();
        setPicks([...previousTeam.picks]);
      }

      // Update draft and history index
      setDraftIndex(draftIndex - 1);
      setHistoryIndex(historyIndex - 1);
      setCurrentTeam(default_draft[draftIndex - 1][0]);
      setCurrentAction(default_draft[draftIndex - 1][1]);
    }
  };

  // Handle the proceed button (進む)
  const handleProceedClick = () => {
    if (historyIndex < history.length) {
      const nextAction = history[historyIndex];
      const nextTeam = nextAction.team;
      const nextActionType = nextAction.action;
      const nextPokemon = nextAction.pokemon;

      // Redo the next action
      if (nextActionType === "BAN") {
        nextTeam.ban(nextPokemon);
        setBans([...nextTeam.bans]);
      } else if (nextActionType === "PICK") {
        nextTeam.pick(nextPokemon);
        setPicks([...nextTeam.picks]);
      }

      // Update draft and history index
      setDraftIndex(draftIndex + 1);
      setHistoryIndex(historyIndex + 1);
      setCurrentTeam(default_draft[draftIndex + 1][0]);
      setCurrentAction(default_draft[draftIndex + 1][1]);
    }
  };

  const handleResetClick = () => {
    // すべてのbanとpickリストを初期化
    setBans([]);  
    setPicks([]);
    teamA.bans = [];
    teamA.picks = [];
    teamB.bans = [];
    teamB.picks = [];
    
    // ドラフトインデックスやチーム、アクションをリセット
    setDraftIndex(0);
    setCurrentTeam(default_draft[0][0]);
    setCurrentAction(default_draft[0][1]);
    
    // ドラフト完了状態のリセット
    setDraftComplete(false);
    
    // 履歴と履歴インデックスを初期化
    setHistory([]);
    setHistoryIndex(0);
    
    // 選択されたポケモンをリセット
    setSelectedPokemon(null);
  };


  // Function to handle search input changes
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  // Function to convert Katakana to Hiragana
  const convertToHiragana = (input) => {
    return input.replace(/[\u30a1-\u30f6]/g, (match) =>
      String.fromCharCode(match.charCodeAt(0) - 0x60)
    );
  };

  // Function to normalize search queries by converting them to lowercase and Hiragana
  const normalizeSearchQuery = (input) => {
    return convertToHiragana(input).toLowerCase();
  };

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

  const [selectedBattleItemsA, setSelectedBattleItemsA] = useState(
    Array(5).fill(null)
  ); // Array of 5 battle items for Team A
  const [selectedBattleItemsB, setSelectedBattleItemsB] = useState(
    Array(5).fill(null)
  ); // Team B battle items

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
    // Reset display text before typing the new phase text
    displayTextRef.current = ""; // Clear the display text state
    setDisplayText(""); // Clear the displayed text

    const teamName = currentTeam === teamA ? "Team A" : "Team B";
    const nextPhaseText = getPhaseText(teamName, currentAction); // Get the new phase text

    setCurrentText(nextPhaseText); // Set the new text for typing
    setIsBackspacing(false); // Ensure we are typing, not backspacing

    const handleTyping = () => {
      if (!isBackspacing) {
        // Add characters one by one for typing
        if (displayTextRef.current.length < currentText.length) {
          displayTextRef.current += currentText.charAt(
            displayTextRef.current.length
          );
          setDisplayText(displayTextRef.current);
          typingRef.current = setTimeout(handleTyping, 100); // Typing speed
        }
      } else {
        // Handle backspacing
        if (displayTextRef.current.length > 0) {
          displayTextRef.current = displayTextRef.current.slice(0, -1);
          setDisplayText(displayTextRef.current);
          typingRef.current = setTimeout(handleTyping, 50); // Backspacing speed
        }
      }
    };

    handleTyping(); // Start the typing effect

    return () => clearTimeout(typingRef.current); // Clean up the timeout on phase change
  }, [currentTeam, currentAction, currentText, isBackspacing]);

  useEffect(() => {
    if (currentTeam === teamA) {
      const currentPlayerIndex = teamA.picks.length;
      setExpandedPlayerIndexA(currentPlayerIndex); // Team Aのプレイヤーを拡大
      setExpandedPlayerIndexB(null); // Team Bの拡大状態をリセット
    } else {
      const currentPlayerIndex = teamB.picks.length;
      setExpandedPlayerIndexB(currentPlayerIndex); // Team Bのプレイヤーを拡大
      setExpandedPlayerIndexA(null); // Team Aの拡大状態をリセット
    }
  }, [draftIndex, currentTeam]);

  // Function to get the phase text
  const getPhaseText = (teamName, action) => {
    if (action === "BAN") {
      return `${teamName} - 使用禁止ポケモンを選択中`; // Ban phase message
    } else if (action === "PICK") {
      const currentPlayerIndex =
        teamName === "Team A" ? teamA.picks.length : teamB.picks.length;
      return `${teamName} Player ${
        currentPlayerIndex + 1
      } - 使用ポケモンを選択中`; // Pick phase message
    }
    return ""; // Default case
  };

  //タイプ変更
  const handleTypeChange = (event) => {
    setSelectedType(event.target.value);
  };

  //ポケモン絞り込み
  // Filter the Pokémon list based on type and search query
  const filteredPokemonList = pokemonList.filter((pokemon) => {
    // Type filtering
    const typeMatches =
      selectedType === "すべて" || pokemon.type === selectedType;

    // Check that English and Japanese names exist before accessing them
    const hasEnglishName = pokemon.name && pokemon.name.English;
    const hasJapaneseName = pokemon.name && pokemon.name.Japanese;

    // Normalize the search query by converting it to Hiragana and lowercase
    const normalizedQuery = normalizeSearchQuery(searchQuery);

    // Name filtering (check English, Japanese, Katakana, and Hiragana)
    const searchMatches =
      searchQuery === "" ||
      (hasEnglishName &&
        pokemon.name.English.toLowerCase().includes(normalizedQuery)) ||
      (hasJapaneseName &&
        convertToHiragana(pokemon.name.Japanese).includes(normalizedQuery)) ||
      (hasJapaneseName &&
        pokemon.name.JapaneseKana &&
        pokemon.name.JapaneseKana.includes(normalizedQuery));

    return typeMatches && searchMatches;
  });

  const handlePokemonClick = (pokemon) => {
    if (draftComplete || isPokemonDisabled(pokemon)) {
      return;
    }
    setSelectedPokemon(pokemon);
  
    if (currentAction === "PICK" && userInteracted) {
      const cry = new Audio(`/${pokemon.name.English.toLowerCase()}.mp3`);
      cry.volume = cryVolume;
      cry.play().catch((error) => {
        console.error("Error playing Pokémon cry:", error);
      });
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
      const newHistory = [...history];
  
      if (currentAction === "BAN") {
        currentTeam.ban(selectedPokemon);
        setBans([...bans, selectedPokemon]);
  
        // Record the action in the history
        newHistory.push({ team: currentTeam, action: "BAN", pokemon: selectedPokemon });
      } else if (currentAction === "PICK") {
        currentTeam.pick(selectedPokemon);
        setPicks([...picks, selectedPokemon]);
  
        // Record the action in the history
        newHistory.push({ team: currentTeam, action: "PICK", pokemon: selectedPokemon });
  
        // Automatically assign held items based on picked Pokémon, if defined
        const defaultItems = defaultHeldItems[selectedPokemon.name.English.toLowerCase()];
        if (defaultItems) {
          if (currentTeam === teamA) {
            const playerIndex = teamA.picks.length - 1; // Get the last picked player index
            setSelectedItemsA((prevItems) => {
              const updatedItems = [...prevItems];
              updatedItems[playerIndex] = defaultItems.map(
                (itemName) => heldItems.find((item) => item.name.English === itemName)
              );
              return updatedItems;
            });
          } else {
            const playerIndex = teamB.picks.length - 1; // Get the last picked player index
            setSelectedItemsB((prevItems) => {
              const updatedItems = [...prevItems];
              updatedItems[playerIndex] = defaultItems.map(
                (itemName) => heldItems.find((item) => item.name.English === itemName)
              );
              return updatedItems;
            });
          }
        }
      }
  
      // Update history and indices
      setHistory(newHistory);
      setHistoryIndex(historyIndex + 1);
      setSelectedPokemon(null); // Clear selected Pokémon for the next step
  
      // Proceed to the next phase by updating the draft index
      if (draftIndex < default_draft.length - 1) {
        setDraftIndex(draftIndex + 1);
        setCurrentTeam(default_draft[draftIndex + 1][0]); // Update to the next team
        setCurrentAction(default_draft[draftIndex + 1][1]); // Update to the next action (BAN or PICK)
      } else {
        setDraftComplete(true); // If the draft is complete, mark it as done
      }
    }
  };

  const updateDraft = (step) => {
    const nextIndex = draftIndex + step;
    if (nextIndex >= 0 && nextIndex < default_draft.length) {
      setDraftIndex(nextIndex);
      const team = default_draft[nextIndex][0];
      const action = default_draft[nextIndex][1];

      setCurrentTeam(team); // Update team
      setCurrentAction(action); // Update action

      const teamName = team === teamA ? "Team A" : "Team B";
      const nextPhaseText = getPhaseText(teamName, action);

      setCurrentText(nextPhaseText); // Update the text to type out
      setIsBackspacing(true); // Start backspacing the previous text

      // Handle expanding the player section
      if (team === teamA) {
        setExpandedPlayerIndexA(teamA.picks.length); // Expand Team A's player
        setExpandedPlayerIndexB(null); // Reset Team B's expanded state
      } else {
        setExpandedPlayerIndexB(teamB.picks.length); // Expand Team B's player
        setExpandedPlayerIndexA(null); // Reset Team A's expanded state
      }
    } else {
      setDraftComplete(true);
      setCurrentText("ドラフトは完了しました。");

      // Reset expanded players when draft is complete
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

  const BattleItemPopup = ({ onSelect }) => {};

  const lanes = ["レーンを選択", "上ルート", "中央エリア", "下ルート"];
  const [selectedLanesA, setSelectedLanesA] = useState(
    Array(5).fill("レーンを選択")
  );
  const [selectedLanesB, setSelectedLanesB] = useState(
    Array(5).fill("レーンを選択")
  );

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
    上ルート: { top: "22%", left: "30%" },
    中央エリア: { top: "45%", left: "25%" },
    下ルート: { top: "80%", left: "30%" },
  };

  const lanePositionsTeamB = {
    上ルート: { top: "22%", right: "30%" },
    中央エリア: { top: "45%", right: "25%" },
    下ルート: { top: "80%", right: "30%" },
  };

  const renderCirclesForLanes = (
    selectedLanesA,
    selectedLanesB,
    teamA,
    teamB
  ) => {
    const laneOffsets = {
      上ルート: 0,
      中央エリア: 0,
      下ルート: 0,
    };

    return (
      <div>
        {/* Team A circles */}
        {selectedLanesA.map((lane, index) => {
          const lanePosition = lanePositionsTeamA[lane]; // Team Aのレーンポジション
          if (lanePosition) {
            // 重複した場合のオフセットを追加
            const offset = laneOffsets[lane] * 4; // オフセットを調整
            laneOffsets[lane] += 1; // 次のプレイヤーのオフセットを増やす

            const selectedPokemon = teamA.picks[index]; // Team Aのプレイヤーが選択したポケモン
            const playerImage = playerImagesA[index]; // プレイヤー画像

            return (
              <div
                key={`teamA-${index}`}
                className="lane-circleA"
                style={{
                  ...lanePosition,
                  left: `calc(${lanePosition.left} + ${offset}vw)`,
                }} // オフセットを追加
              >
                <img
                  src={selectedPokemon ? selectedPokemon.imageUrl : playerImage} // 選択されたポケモンがある場合、その画像を表示
                  alt={
                    selectedPokemon
                      ? selectedPokemon.name.English
                      : `Player ${index + 1}`
                  }
                  style={{ width: "100%", height: "100%" }}
                />
              </div>
            );
          }
          return null;
        })}

        {/* Team B circles */}
        {Object.keys(laneOffsets).forEach((lane) => (laneOffsets[lane] = 0))}

        {selectedLanesB.map((lane, index) => {
          const lanePosition = lanePositionsTeamB[lane]; // Team Bのレーンポジション
          if (lanePosition) {
            // 重複した場合のオフセットを追加
            const offset = laneOffsets[lane] * 4; // オフセットを調整
            laneOffsets[lane] += 1; // 次のプレイヤーのオフセットを増やす

            const selectedPokemon = teamB.picks[index]; // Team Bのプレイヤーが選択したポケモン
            const playerImage = playerImagesB[index]; // プレイヤー画像

            return (
              <div
                key={`teamB-${index}`}
                className="lane-circleB"
                style={{
                  ...lanePosition,
                  right: `calc(${lanePosition.right} + ${offset}vw)`,
                }} // オフセットを追加
              >
                <img
                  src={selectedPokemon ? selectedPokemon.imageUrl : playerImage} // 選択されたポケモンがある場合、その画像を表示
                  alt={
                    selectedPokemon
                      ? selectedPokemon.name.English
                      : `Player ${index + 1}`
                  }
                  style={{ width: "100%", height: "100%" }}
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
        <button 
          className="undo-button" 
          onClick={handleUndoClick} 
          disabled={historyIndex === 0}
        >
          ←
        </button>
        <div className="header__title">
          <h1>
            {draftComplete ? "ドラフトは完了しました。" : displayText}{" "}
            {/* Just display `displayText` here */}
          </h1>
        </div>
        <button
          className="proceed-button"
          onClick={handleProceedClick}
          disabled={historyIndex >= history.length}
        >
          →
        </button>
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
        <div className="name-search">
          <input
            type="text"
            placeholder="ポケモンの名前を検索"
            value={searchQuery}
            onChange={handleSearchChange} // Search handler function
          />
          {searchQuery && (
            <button className="clear-button" onClick={() => setSearchQuery("")}>
              &#10005; {/* Unicode character for '×' */}
            </button>
          )}
        </div>
        <div className="volume-control">
        <label htmlFor="volume">Volume: </label>
        <input
          id="volume"
          type="range"
          min="0"
          max="100"
          value={bgmVolume * 100}
          onChange={handleVolumeChange}
        />
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
                    className="banned-image"
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
                }`}
              >
                {/* Pick Pokémon Image */}
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
                      className="picked-image"
                    />
                  ) : (
                    <span>{pickOrderA[index]}</span>
                  )}
                </div>

                {/* Container for Icon and Dropdown */}
                <div className="icon-dropdown-container">
                  {/* Icon Container (Held Items + Battle Item) */}
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
                                alt={
                                  selectedItemsA[index][iconIndex].name.English
                                }
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    {/* Battle Item Circle for Team A */}
                    <div
                      className="battle-item-circle"
                      onClick={() => handlePopupOpen("A", index)}
                    >
                      {selectedBattleItemsA[index] && (
                        <img
                          src={selectedBattleItemsA[index].imageUrl}
                          alt={selectedBattleItemsA[index].name}
                          className="battle-item-selected"
                        />
                      )}
                    </div>
                  </div>

                  {/* Lane Select Dropdown - Placed under the icon-container */}
                  <div className="lane-select-dropdown-container">
                    <select
                      value={selectedLanesA[index]}
                      onChange={(event) => handleLaneSelect("A", index, event)}
                      className="lane-select-dropdown"
                    >
                      {lanes.map((lane, i) => (
                        <option key={i} value={lane}>
                          {lane}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Battle Item Popup */}
                {popupOpenIndex === index && (
                  <BattleItemPopup
                    onSelect={(item) =>
                      handleBattleItemSelect(index, item, "A")
                    }
                  />
                )}

                {/* Player Image */}
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
            <h2>Select 3 Held Items</h2>
            <div className="helditem-grid">
              {heldItems.map((item) => {
                const itemIndex = selectedItems.indexOf(item); // Get the item's index in the selectedItems array
                return (
                  <div key={item.id} className="helditem-option-container">
                    <img
                      src={item.imageUrl}
                      alt={item.name.English}
                      className={`helditem-option ${
                        itemIndex !== -1 ? "selected" : ""
                      }`}
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
                  onClick={() =>
                    handleBattleItemSelect(popupOpenIndex, item, "A")
                  } // Handle battle item selection
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
                  onClick={() =>
                    handleBattleItemSelect(popupOpenIndexB, item, "B")
                  } // Handle battle item selection for Team B
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {isPopupVisible && (
        <div className="popup-overlay">
          <div className="lane-selection-popup">
            <img
              src={`${process.env.PUBLIC_URL}/Theia_Sky_Ruins.png`}
              alt="Theia Sky Ruins Map"
            />
            {/* Draw circles based on lane selection */}
            {renderCirclesForLanes(
              selectedLanesA,
              selectedLanesB,
              teamA,
              teamB
            )}
            <button className="close-button" onClick={handlePopupClose}>
              ×
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
                    className="banned-image"
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
                }`}
                style={{ display: "flex", alignItems: "center" }} // Horizontally align the contents
              >
                {/* Player Image on the Left */}
                <div className="player-imageB">
                  <img src={playerImagesB[index]} alt={`Player ${index + 1}`} />
                </div>

                {/* Icon and Dropdown Container in the middle */}
                <div
                  className="icon-dropdown-container"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  {/* Icon Container (Held Items + Battle Item) */}
                  <div className="icon-container">
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
                    {/* Battle Item Circle for Team B */}
                    <div
                      className="battle-item-circle"
                      onClick={() => handlePopupOpen("B", index)}
                    >
                      {selectedBattleItemsB[index] && (
                        <img
                          src={selectedBattleItemsB[index].imageUrl}
                          alt={selectedBattleItemsB[index].name}
                          className="battle-item-selected"
                        />
                      )}
                    </div>
                  </div>

                  {/* Lane Select Dropdown - Placed under the icon-container */}
                  <div className="lane-select-dropdown-container">
                    <select
                      value={selectedLanesB[index]}
                      onChange={(event) => handleLaneSelect("B", index, event)}
                      className="lane-select-dropdown"
                    >
                      {lanes.map((lane, i) => (
                        <option key={i} value={lane}>
                          {lane}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Pick Pokémon Image on the right */}
                <div className="pick-pokemon-image-container">
                  {teamB.picks[index] ? (
                    <img
                      src={teamB.picks[index].imageUrl}
                      alt={teamB.picks[index].name.English}
                      className="picked-image"
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
                    <span>{pickOrderB[index]}</span>
                  )}
                </div>

                {/* Battle Item Popup */}
                {popupOpenIndex === index && (
                  <BattleItemPopup
                    onSelect={(item) =>
                      handleBattleItemSelect(index, item, "B")
                    }
                  />
                )}
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
          disabled={currentAction === "COMPLETE" || !selectedPokemon}
          className={`confirm-button ${
          currentAction === "BAN" ? "ban-button" : "pick-button"
          }`}
        >
        {currentAction === "BAN" ? "BAN" : currentAction === "COMPLETE" ? "完了" : "PICK"}
        </button>
        <button className="reset-button" onClick={handleResetClick}>
          リセット
        </button>
      </div>
    </div>
  );
};

export default App;
