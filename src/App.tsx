import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Flag, Settings, AlertTriangle, Clock, Fuel, Users, MapPin, GripVertical } from 'lucide-react';

const PitStrategyApp = () => {
  // Race Configuration State
  const [raceConfig, setRaceConfig] = useState({
    track: '',
    raceLengthHours: 24,
    fuelRangeMinutes: 108,
    minPitTimeSeconds: 170,
    numTeams: 1,
    teams: [{ number: '', name: '', drivers: [''], driverAssignments: [] }]
  });

  // Race State
  const [raceStarted, setRaceStarted] = useState(false);
  const [racePaused, setRacePaused] = useState(false);
  const [raceStartTime, setRaceStartTime] = useState(null);
  const [pausedTime, setPausedTime] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [fcyActive, setFcyActive] = useState(false);

  // Team States
  const [selectedTeam, setSelectedTeam] = useState(0);
  const [teamStates, setTeamStates] = useState([]);

  // Modal states for editing
  const [showElapsedModal, setShowElapsedModal] = useState(false);
  const [showRemainingModal, setShowRemainingModal] = useState(false);
  const [showRaceTimeModal, setShowRaceTimeModal] = useState(false);
  const [showFuelRangeModal, setShowFuelRangeModal] = useState(false);
  const [showStintTimeModal, setShowStintTimeModal] = useState(false);
  const [tempTimeValue, setTempTimeValue] = useState('');
  const [tempFuelRangeValue, setTempFuelRangeValue] = useState('');
  const [editingStint, setEditingStint] = useState({ index: null, field: null, type: null });
  
  // Pit stop management
  const [showPitDialog, setShowPitDialog] = useState(false);
  const [pitReason, setPitReason] = useState('scheduled');
  const [fuelTaken, setFuelTaken] = useState(true);
  const [driverChanged, setDriverChanged] = useState(true);
  const [selectedDriverIndex, setSelectedDriverIndex] = useState(0);

  // Drag and Drop State
  const [draggedDriver, setDraggedDriver] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Utility Functions
  const getElapsedTime = (startTime) => {
    if (!startTime) return 0;
    const rawElapsed = (currentTime - startTime) / 60000; // minutes with decimals for seconds
    
    // Cap elapsed time at the current stint's planned length to prevent exceeding fuel range
    const currentTeamState = teamStates[selectedTeam];
    const currentStintData = currentTeamState?.stints?.[currentTeamState.currentStint - 1];
    const maxElapsed = currentStintData?.plannedLength || raceConfig.fuelRangeMinutes;
    
    return Math.min(rawElapsed, maxElapsed);
  };

  const getRemainingTime = (startTime, plannedLength) => {
    if (!startTime) return plannedLength;
    const elapsed = getElapsedTime(startTime);
    const remaining = Math.max(0, plannedLength - elapsed);
    
    // Safety check: if elapsed time exceeds planned length, remaining should be 0
    if (elapsed >= plannedLength) {
      return 0;
    }
    
    return remaining;
  };

  const getRemainingRaceTime = () => {
    if (!raceStartTime) return raceConfig.raceLengthHours * 60; // Return full race time in minutes
    
    const elapsed = getElapsedTime(raceStartTime);
    const totalRaceMinutes = raceConfig.raceLengthHours * 60;
    const remaining = totalRaceMinutes - elapsed;
    
    return Math.max(0, remaining);
  };

  const formatTime = (date) => {
    if (!date) return '--:--:--';
    return date.toLocaleTimeString('en-US', { hour12: false });
  };

  const formatDurationToHMS = (minutes) => {
    if (minutes === null || minutes === undefined || isNaN(minutes) || minutes <= 0) {
      return "00:00:00";
    }
    
    const totalSeconds = Math.floor(minutes * 60);
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatDuration = (minutes) => {
    if (minutes < 0) return `-${Math.floor(Math.abs(minutes) / 60)}:${String(Math.abs(minutes) % 60).padStart(2, '0')}`;
    return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`;
  };

  const formatRaceTime = (minutes) => {
    if (minutes <= 0) return "00:00:00";
    
    const totalSeconds = Math.floor(minutes * 60);
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const calculateFCYBuffer = (teamIndex) => {
    const team = teamStates[teamIndex];
    if (!team || !team.stintStartTime) return { buffer: 0, showGreen: false, isInWindow: false };
    
    const elapsed = getElapsedTime(team.stintStartTime);
    const remainingRaceMinutes = getRemainingRaceTime();
    const maxStintLength = raceConfig.fuelRangeMinutes;
    
    // FCY window opens 20 minutes before max stint length
    const fcyWindowOpensAt = maxStintLength - 20; // e.g., 108 - 20 = 88 minutes
    
    // Simple check first - are we past the time threshold?
    if (elapsed >= fcyWindowOpensAt) {
      // Past the time threshold, check pit strategy
      const remainingFuelInStint = maxStintLength - elapsed;
      const stopsNeededIfDontPit = Math.ceil((remainingRaceMinutes - remainingFuelInStint) / maxStintLength);
      const stopsNeededIfPitNow = Math.ceil(remainingRaceMinutes / maxStintLength);
      
      const wouldAddExtraStop = stopsNeededIfPitNow > stopsNeededIfDontPit;
      
      if (!wouldAddExtraStop) {
        return {
          buffer: 0,
          showGreen: true,
          isInWindow: true
        };
      }
    }
    
    // Either not past time threshold OR would add extra stops
    const timeUntilWindow = Math.max(0, fcyWindowOpensAt - elapsed);
    
    return {
      buffer: timeUntilWindow,
      showGreen: false,
      isInWindow: false
    };
  };

  const canPitOnFCY = (teamIndex) => {
    const fcyData = calculateFCYBuffer(teamIndex);
    return fcyData.showGreen;
  };

  const getDriverForStint = (stintIndex, teamIndex = selectedTeam) => {
    const team = raceConfig.teams[teamIndex];
    const teamState = teamStates[teamIndex];
    const stint = teamState?.stints?.[stintIndex];
    
    if (!team || !team.drivers.length) {
      console.log(`No team or no drivers found`);
      return '--';
    }
    
    // If the stint has a driver field populated, use that (for completed stints, unscheduled stops, etc.)
    if (stint && stint.driver) {
      return stint.driver;
    }
    
    // Check if there are custom driver assignments
    if (team.driverAssignments && team.driverAssignments.length > stintIndex) {
      const driverIndex = team.driverAssignments[stintIndex];
      const assignedDriver = team.drivers[driverIndex] || '--';
      return assignedDriver;
    }
    
    // Default rotation for planned stints
    const rotationDriver = team.drivers[stintIndex % team.drivers.length] || '--';
    return rotationDriver;
  };

  const generateStintPlan = (fuelRange, raceHours, startTime = null) => {
    const totalRaceMinutes = raceHours * 60;
    const stints = [];
    let raceTimeUsed = 0; // Track total race time used
    let stintNumber = 1;
    
    while (raceTimeUsed < totalRaceMinutes) {
      const remainingRaceTime = totalRaceMinutes - raceTimeUsed;
      const stintLength = Math.min(fuelRange, remainingRaceTime);
      
      // Don't create stints that are too short to be meaningful (but allow very short final stints)
      if (stintLength <= 0) {
        break;
      }
      
      // Ensure no stint exceeds fuel range
      const cappedStintLength = Math.min(stintLength, fuelRange);
      
      const stint = {
        stintNumber,
        plannedLength: cappedStintLength,
        calculatedLength: null,
        plannedStart: startTime ? new Date(startTime.getTime() + (raceTimeUsed * 60000)) : null,
        predictedStart: null,
        plannedFinish: startTime ? new Date(startTime.getTime() + (raceTimeUsed + cappedStintLength) * 60000) : null,
        predictedFinish: null,
        actualStart: null,
        actualFinish: null,
        pitTime: raceConfig.minPitTimeSeconds,
        actualPitTime: null,
        fuelTaken: null,
        driver: '',
        elapsed: 0,
        remaining: cappedStintLength,
        fcyBuffer: 0,
        status: 'planned',
        isUnscheduled: false
      };
      
      stints.push(stint);
      raceTimeUsed += cappedStintLength; // Add stint length to race time used
      stintNumber++;
      
      // Safety check: if we've reached or exceeded the race duration, stop
      if (raceTimeUsed >= totalRaceMinutes) {
        break;
      }
    }
    
    // Verify no stint exceeds fuel range
    stints.forEach((stint, index) => {
      if (stint.plannedLength > fuelRange) {
        stint.plannedLength = fuelRange;
        stint.remaining = fuelRange;
      }
    });
    
    return stints;
  };

  const recalculateStintPlan = (teamIndex) => {
    const team = teamStates[teamIndex];
    if (!team || !raceStartTime) return team.stints;

    const remainingRaceMinutes = getRemainingRaceTime();
    if (remainingRaceMinutes <= 5) {
      // Race is almost over, don't add more stints
      return team.stints.filter(stint => stint.status === 'completed' || stint.status === 'active');
    }
    
    // Find all completed stints and current active stint
    const completedStints = team.stints.filter(stint => stint.status === 'completed');
    const activeStint = team.stints.find(stint => stint.status === 'active');
    
    // Calculate how much race time we've already used
    let raceTimeUsed = 0;
    completedStints.forEach(stint => {
      raceTimeUsed += stint.calculatedLength || stint.plannedLength;
    });
    
    // If there's an active stint, add its elapsed time
    if (activeStint && team.stintStartTime) {
      const elapsedInActiveStint = getElapsedTime(team.stintStartTime);
      raceTimeUsed += elapsedInActiveStint;
    }
    
    // Calculate remaining time after current stint
    let timeAfterCurrentStint = remainingRaceMinutes;
    if (activeStint && team.stintStartTime) {
      const remainingInCurrentStint = getRemainingTime(team.stintStartTime, activeStint.plannedLength);
      timeAfterCurrentStint = Math.max(0, remainingRaceMinutes - remainingInCurrentStint);
    }
    
    // Keep completed stints and current active stint
    let newStints = [...completedStints];
    if (activeStint) {
      newStints.push(activeStint);
    }
    
    // Add future stints only if needed and only up to race end
    if (timeAfterCurrentStint > 5) {
      let futureRaceTimeUsed = 0;
      let stintNumber = newStints.length + 1;
      
      while (futureRaceTimeUsed < timeAfterCurrentStint) {
        const remainingTime = timeAfterCurrentStint - futureRaceTimeUsed;
        const stintLength = Math.min(raceConfig.fuelRangeMinutes, remainingTime);
        
        // Don't create stints that are too short
        if (stintLength < 5) break;
        
        const estimatedStartTime = new Date(Date.now() + (futureRaceTimeUsed * 60000));
        
        newStints.push({
          stintNumber,
          plannedLength: stintLength,
          calculatedLength: null,
          plannedStart: estimatedStartTime,
          predictedStart: estimatedStartTime,
          plannedFinish: new Date(estimatedStartTime.getTime() + (stintLength * 60000)),
          predictedFinish: new Date(estimatedStartTime.getTime() + (stintLength * 60000)),
          actualStart: null,
          actualFinish: null,
          pitTime: raceConfig.minPitTimeSeconds,
          actualPitTime: null,
          fuelTaken: null,
          driver: '',
          elapsed: 0,
          remaining: stintLength,
          fcyBuffer: 0,
          status: 'planned',
          isUnscheduled: false
        });
        
        futureRaceTimeUsed += stintLength;
        stintNumber++;
        
        // Safety check: if we've used all remaining race time, stop
        if (futureRaceTimeUsed >= timeAfterCurrentStint) break;
      }
    }
    
    return newStints;
  };

  // Initialize team states when race config changes
  useEffect(() => {
    
    if (!raceConfig.teams || raceConfig.teams.length === 0) {
      return;
    }
    
    const initialStates = raceConfig.teams.map((team, index) => {
      // Ensure drivers array exists
      const drivers = team.drivers || [''];
      const validDrivers = drivers.filter(driver => driver && driver.trim());
      
      return {
        currentStint: 1,
        stintStartTime: null,
        currentDriver: 0,
        stints: generateStintPlan(raceConfig.fuelRangeMinutes, raceConfig.raceLengthHours),
        lastPitTime: null,
        position: index + 1
      };
    });
    
    setTeamStates(initialStates);
  }, [raceConfig.teams.length, raceConfig.fuelRangeMinutes, raceConfig.raceLengthHours, raceConfig.minPitTimeSeconds]);

  // Timer effect - also triggers FCY buffer updates
  useEffect(() => {
    if (raceStarted && !racePaused) {
      const interval = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [raceStarted, racePaused]);

  const addTeam = () => {
    setRaceConfig(prev => ({
      ...prev,
      numTeams: prev.numTeams + 1,
      teams: [...prev.teams, { number: '', name: '', drivers: [''], driverAssignments: [] }]
    }));
  };

  const updateTeam = (teamIndex, field, value) => {
    setRaceConfig(prev => ({
      ...prev,
      teams: prev.teams.map((team, i) => 
        i === teamIndex ? { ...team, [field]: value } : team
      )
    }));
  };

  const addDriver = (teamIndex) => {
    setRaceConfig(prev => ({
      ...prev,
      teams: prev.teams.map((team, i) => 
        i === teamIndex ? { ...team, drivers: [...team.drivers, ''] } : team
      )
    }));
  };

  const updateDriver = (teamIndex, driverIndex, name) => {
    setRaceConfig(prev => ({
      ...prev,
      teams: prev.teams.map((team, i) => 
        i === teamIndex ? {
          ...team,
          drivers: team.drivers.map((driver, j) => j === driverIndex ? name : driver)
        } : team
      )
    }));
  };

  const deleteTeam = (teamIndex) => {
    if (raceConfig.teams.length > 1) {
      setRaceConfig(prev => ({
        ...prev,
        numTeams: prev.numTeams - 1,
        teams: prev.teams.filter((_, i) => i !== teamIndex)
      }));
      // Reset selected team if necessary
      if (selectedTeam >= teamIndex) {
        setSelectedTeam(Math.max(0, selectedTeam - 1));
      }
    }
  };

  const deleteDriver = (teamIndex, driverIndex) => {
    const team = raceConfig.teams[teamIndex];
    if (team.drivers.length > 1) {
      setRaceConfig(prev => ({
        ...prev,
        teams: prev.teams.map((team, i) => 
          i === teamIndex ? {
            ...team,
            drivers: team.drivers.filter((_, j) => j !== driverIndex),
            driverAssignments: [] // Reset driver assignments when drivers change
          } : team
        )
      }));
    }
  };

  const startRace = () => {
    const now = new Date();
    setRaceStartTime(now);
    setRaceStarted(true);
    setRacePaused(false);
    setPausedTime(0);
    
    // Initialize first stint for all teams
    setTeamStates(prev => prev.map(team => ({
      ...team,
      stintStartTime: now,
      stints: team.stints.map((stint, i) => {
        if (i === 0) {
          // First stint starts now for ALL teams
          return {
            ...stint,
            plannedStart: now,
            predictedStart: now,
            actualStart: now,
            plannedFinish: new Date(now.getTime() + (stint.plannedLength * 60000)),
            status: 'active'  // Mark first stint as active for all teams
          };
        } else {
          // Calculate planned times for future stints based on ONLY race time (no pit stops)
          const cumulativeRaceTime = team.stints.slice(0, i).reduce((total, prevStint) => total + prevStint.plannedLength, 0);
          
          // Planned times are based on race time only (for strategy) - this is when the stint should happen in race time
          const plannedStartTime = new Date(now.getTime() + (cumulativeRaceTime * 60000));
          const plannedFinishTime = new Date(plannedStartTime.getTime() + (stint.plannedLength * 60000));
          
          // Predicted times include pit stops (for actual clock timing)
          const pitTimeMinutes = (i * raceConfig.minPitTimeSeconds) / 60; // Total pit time for all previous stops
          const predictedStartTime = new Date(now.getTime() + ((cumulativeRaceTime + pitTimeMinutes) * 60000));
          const predictedFinishTime = new Date(predictedStartTime.getTime() + (stint.plannedLength * 60000));
          
          return {
            ...stint,
            plannedStart: plannedStartTime,
            plannedFinish: plannedFinishTime,
            predictedStart: predictedStartTime,
            predictedFinish: predictedFinishTime,
            status: 'planned'  // Ensure future stints are marked as planned
          };
        }
      })
    })));
  };

  const pauseRace = () => {
    if (racePaused) {
      // Resume race
      const pauseDuration = Date.now() - pausedTime;
      setRaceStartTime(prev => new Date(prev.getTime() + pauseDuration));
      setTeamStates(prev => prev.map(team => ({
        ...team,
        stintStartTime: team.stintStartTime ? new Date(team.stintStartTime.getTime() + pauseDuration) : null,
        lastPitTime: team.lastPitTime ? new Date(team.lastPitTime.getTime() + pauseDuration) : null
      })));
      setRacePaused(false);
      setPausedTime(0);
    } else {
      // Pause race
      setRacePaused(true);
      setPausedTime(Date.now());
    }
  };

  const stopRace = () => {
    setRaceStarted(false);
    setRacePaused(false);
    setRaceStartTime(null);
    setPausedTime(0);
    setFcyActive(false);
    setTeamStates(prev => prev.map(team => ({
      ...team,
      currentStint: 1,
      stintStartTime: null,
      currentDriver: 0,
      lastPitTime: null,
      stints: generateStintPlan(raceConfig.fuelRangeMinutes, raceConfig.raceLengthHours)
    })));
  };

  const executePit = (teamIndex = selectedTeam) => {
    
    // Validate team index
    if (teamIndex < 0 || teamIndex >= teamStates.length) {
      console.error(`Invalid team index: ${teamIndex}, teamStates length: ${teamStates.length}`);
      return;
    }
    
    // Validate team state exists
    const currentTeamForPit = teamStates[teamIndex];
    if (!currentTeamForPit) {
      console.error(`No team state found for index: ${teamIndex}`);
      return;
    }
    
    // Validate team config exists
    const teamConfig = raceConfig.teams[teamIndex];
    if (!teamConfig) {
      console.error(`No team config found for index: ${teamIndex}`);
      return;
    }
    
    // Ensure we're working with the correct team
    setSelectedTeam(teamIndex);
    
    setShowPitDialog(true);
    setPitReason(fcyActive ? 'fcyOpportunity' : 'scheduled');
    setFuelTaken(true);
    setDriverChanged(true);
    
    // Set the default next driver (next in rotation)
    const currentDriverIndex = currentTeamForPit.currentDriver || 0;
    const driversArray = teamConfig.drivers || [];
    const nextDriverIndex = driversArray.length > 0 
      ? (currentDriverIndex + 1) % driversArray.length 
      : 0;
    
    setSelectedDriverIndex(nextDriverIndex);
  };

  const confirmPitStop = () => {
    const now = new Date();
    const currentStintIndex = teamStates[selectedTeam].currentStint - 1;
    const elapsed = getElapsedTime(teamStates[selectedTeam].stintStartTime);
    const pitTimeMs = raceConfig.minPitTimeSeconds * 1000;
    
    setTeamStates(prev => {
      return prev.map((team, i) => {
        if (i !== selectedTeam) return team;
        
        let updatedStints = [...team.stints];
        let newCurrentStint = team.currentStint;
        let newStintStartTime = team.stintStartTime;
        
        // Handle pit stops differently based on type
        const activeStintIndex = updatedStints.findIndex(stint => stint.status === 'active');
        
        if (activeStintIndex >= 0) {
          const activeStint = updatedStints[activeStintIndex];
          
          if (pitReason === 'unscheduled') {
            // UNSCHEDULED STOPS: Mark current stint as unscheduled, then create new active stint
            
            // First, mark the current stint as completed with unscheduled reason
            updatedStints[activeStintIndex] = {
              ...activeStint,
              calculatedLength: elapsed,
              actualFinish: now,
              predictedFinish: now,
              status: 'completed',
              fuelTaken: fuelTaken,
              pitReason: 'unscheduled',
              driverChanged: driverChanged,
              driver: raceConfig.teams[selectedTeam].drivers[team.currentDriver]
            };
            
            // Create new active stint row with next stint number
            const nextStintNumber = team.currentStint + 1;
            
            // Simple rule: Fuel taken = reset to max fuel range, No fuel = don't reset timer
            const stintLength = fuelTaken ? raceConfig.fuelRangeMinutes : (activeStint.plannedLength - elapsed);
            
            const newActiveStint = {
              stintNumber: nextStintNumber,
              plannedLength: stintLength,
              calculatedLength: null,
              plannedStart: new Date(now.getTime() + pitTimeMs),
              predictedStart: new Date(now.getTime() + pitTimeMs),
              plannedFinish: new Date(now.getTime() + pitTimeMs + (stintLength * 60000)),
              predictedFinish: new Date(now.getTime() + pitTimeMs + (stintLength * 60000)),
              actualStart: new Date(now.getTime() + pitTimeMs),
              actualFinish: null,
              pitTime: raceConfig.minPitTimeSeconds,
              actualPitTime: null,
              status: 'active',
              fuelTaken: null,
              pitReason: null,
              driverChanged: null,
              driver: driverChanged ? raceConfig.teams[selectedTeam].drivers[selectedDriverIndex] : raceConfig.teams[selectedTeam].drivers[team.currentDriver],
              elapsed: 0,
              remaining: stintLength,
              fcyBuffer: 0,
              isUnscheduled: false
            };
            
            // Insert the new active stint after current stint
            updatedStints.splice(activeStintIndex + 1, 0, newActiveStint);
            
            // Renumber all subsequent planned stints
            for (let i = activeStintIndex + 2; i < updatedStints.length; i++) {
              updatedStints[i].stintNumber = updatedStints[i].stintNumber + 1;
            }
            
            // Update current stint tracking
            newCurrentStint = nextStintNumber;
            if (fuelTaken) {
              // Fresh timer starts with new fuel
              newStintStartTime = new Date(now.getTime() + pitTimeMs);
            } else {
              // Continue the original timer - adjust start time to maintain elapsed time
              const originalElapsed = elapsed;
              newStintStartTime = new Date((now.getTime() + pitTimeMs) - (originalElapsed * 60000));
            }
            
          } else {
            // SCHEDULED/FCY STOPS: Update existing planned stint
            
            updatedStints[activeStintIndex] = {
              ...activeStint,
              calculatedLength: elapsed,
              actualFinish: now,
              predictedFinish: now,
              status: 'completed',
              fuelTaken: fuelTaken,
              pitReason: pitReason,
              driverChanged: driverChanged,
              driver: raceConfig.teams[selectedTeam].drivers[team.currentDriver]
            };
            
            
            if (fuelTaken) {
              // Move to next planned stint
              newCurrentStint = team.currentStint + 1;
              newStintStartTime = new Date(now.getTime() + pitTimeMs);
              
              // Find and activate next planned stint
              const nextPlannedIndex = updatedStints.findIndex((stint, idx) => 
                idx > activeStintIndex && stint.status === 'planned'
              );
              
              
              if (nextPlannedIndex >= 0) {
                const nextDriver = driverChanged 
                  ? raceConfig.teams[selectedTeam].drivers[selectedDriverIndex]
                  : raceConfig.teams[selectedTeam].drivers[team.currentDriver];
                
                
                // Force the planned length to be exactly the fuel range when fuel is taken
                // AND set the start time to NOW, not future time
                updatedStints[nextPlannedIndex] = {
                  ...updatedStints[nextPlannedIndex],
                  plannedLength: raceConfig.fuelRangeMinutes, // Force to exactly 108 minutes
                  predictedStart: now, // Start now, not in the future
                  actualStart: now,    // Start now, not in the future
                  status: 'active',
                  driver: nextDriver
                };
                
                // Set the team's stint start time to NOW as well
                newStintStartTime = now;
                

              } else {
                console.log(`No next planned stint found after index ${activeStintIndex}`);
                console.log(`All stints:`, updatedStints.map((s, idx) => ({ index: idx, number: s.stintNumber, status: s.status })));
              }
            } else {
              // No fuel taken - continue current stint
              newStintStartTime = team.stintStartTime;
              newCurrentStint = team.currentStint;
              console.log(`No fuel taken - continuing current stint ${team.currentStint}`);
            }
          }
        } else {
          console.log(`ERROR: No active stint found for team ${i}!`);
          console.log(`All stint statuses:`, updatedStints.map(s => s.status));
        }
        
        // Calculate new current driver
        const newCurrentDriver = driverChanged 
          ? selectedDriverIndex
          : team.currentDriver;

        const newTeamState = {
          ...team,
          currentStint: newCurrentStint,
          stintStartTime: newStintStartTime,
          lastPitTime: now,
          currentDriver: newCurrentDriver,
          stints: updatedStints
        };
        
        console.log(`Returning new team state for team ${i}:`, newTeamState);
        return newTeamState;
      });
    });
    
    // Only recalculate stint plans for fuel-taking unscheduled stops
    // Don't recalculate for scheduled stops as it overrides our changes
    if (fuelTaken && pitReason === 'unscheduled') {
      setTimeout(() => {
        setTeamStates(prev => prev.map((team, i) => {
          if (i !== selectedTeam) return team;
          return {
            ...team,
            stints: recalculateStintPlan(i)
          };
        }));
      }, 100);
    }
    
    setShowPitDialog(false);
    setFcyActive(false);
    setPitReason('scheduled');
    setFuelTaken(true);
    setDriverChanged(true);
    setSelectedDriverIndex(0);
  };

  const toggleFCY = () => {
    setFcyActive(!fcyActive);
  };

  // Drag and Drop Functions for Stint Schedule
  const handleDriverDragStart = (e, stintIndex) => {
    setDraggedDriver({ stintIndex, teamIndex: selectedTeam });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDriverDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDriverDragEnter = (e, stintIndex) => {
    e.preventDefault();
    setDragOverIndex(stintIndex);
  };

  const handleDriverDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverIndex(null);
    }
  };

  const handleDriverDrop = (e, targetStintIndex) => {
    e.preventDefault();
    
    if (!draggedDriver || draggedDriver.teamIndex !== selectedTeam) {
      setDraggedDriver(null);
      setDragOverIndex(null);
      return;
    }

    const sourceStintIndex = draggedDriver.stintIndex;
    
    if (sourceStintIndex === targetStintIndex) {
      setDraggedDriver(null);
      setDragOverIndex(null);
      return;
    }

    // Create a new driver assignment array for this team
    const teamDrivers = [...raceConfig.teams[selectedTeam].drivers];
    const totalStints = teamStates[selectedTeam].stints.length;
    
    // Create current driver assignments
    let currentAssignments = raceConfig.teams[selectedTeam].driverAssignments || [];
    if (currentAssignments.length === 0) {
      currentAssignments = Array.from({ length: totalStints }, (_, index) => 
        index % teamDrivers.length
      );
    }
    
    // Swap the driver assignments
    const temp = currentAssignments[sourceStintIndex];
    currentAssignments[sourceStintIndex] = currentAssignments[targetStintIndex];
    currentAssignments[targetStintIndex] = temp;
    
    // Update the team configuration
    setRaceConfig(prev => ({
      ...prev,
      teams: prev.teams.map((team, index) => 
        index === selectedTeam ? {
          ...team,
          driverAssignments: [...currentAssignments]
        } : team
      )
    }));

    setDraggedDriver(null);
    setDragOverIndex(null);
  };

  // Modal functions for editing times
  const openElapsedModal = () => {
    if (!teamStates[selectedTeam]?.stintStartTime) return;
    const currentValue = getElapsedTime(teamStates[selectedTeam].stintStartTime);
    setTempTimeValue(formatDurationToHMS(currentValue));
    setShowElapsedModal(true);
  };

  const openRemainingModal = () => {
    if (!teamStates[selectedTeam]?.stintStartTime) return;
    const currentTeam = teamStates[selectedTeam];
    const currentStint = currentTeam.stints[currentTeam.currentStint - 1];
    const currentValue = getRemainingTime(currentTeam.stintStartTime, currentStint?.plannedLength || 0);
    setTempTimeValue(formatDurationToHMS(currentValue));
    setShowRemainingModal(true);
  };

  const openRaceTimeModal = () => {
    setTempTimeValue(formatRaceTime(getRemainingRaceTime()));
    setShowRaceTimeModal(true);
  };

  const saveElapsedTime = () => {
    if (!tempTimeValue) {
      setShowElapsedModal(false);
      setTempTimeValue('');
      return;
    }

    // Parse the time value (format: HH:MM:SS or MM:SS)
    const parts = tempTimeValue.split(':').map(p => parseInt(p) || 0);
    let totalMinutes = 0;
    
    if (parts.length === 2) {
      // MM:SS format
      totalMinutes = parts[0] + (parts[1] / 60);
    } else if (parts.length === 3) {
      // HH:MM:SS format
      totalMinutes = parts[0] * 60 + parts[1] + (parts[2] / 60);
    }

    // Adjust stint start time based on new elapsed time
    const newStartTime = new Date(currentTime.getTime() - (totalMinutes * 60000));
    setTeamStates(prev => prev.map((team, index) => 
      index === selectedTeam ? { ...team, stintStartTime: newStartTime } : team
    ));

    setShowElapsedModal(false);
    setTempTimeValue('');
  };

  const saveRemainingTime = () => {
    if (!tempTimeValue) {
      setShowRemainingModal(false);
      setTempTimeValue('');
      return;
    }

    // Parse the time value (format: HH:MM:SS or MM:SS)
    const parts = tempTimeValue.split(':').map(p => parseInt(p) || 0);
    let totalMinutes = 0;
    
    if (parts.length === 2) {
      // MM:SS format
      totalMinutes = parts[0] + (parts[1] / 60);
    } else if (parts.length === 3) {
      // HH:MM:SS format
      totalMinutes = parts[0] * 60 + parts[1] + (parts[2] / 60);
    }

    const currentTeam = teamStates[selectedTeam];
    const currentStint = currentTeam.stints[currentTeam.currentStint - 1];
    
    // Adjust stint start time based on new remaining time
    const currentStintLength = currentStint?.plannedLength || 0;
    const newElapsed = currentStintLength - totalMinutes;
    const newStartTime = new Date(currentTime.getTime() - (newElapsed * 60000));
    setTeamStates(prev => prev.map((team, index) => 
      index === selectedTeam ? { ...team, stintStartTime: newStartTime } : team
    ));

    setShowRemainingModal(false);
    setTempTimeValue('');
  };

  const saveRaceTime = () => {
    if (!tempTimeValue) {
      setShowRaceTimeModal(false);
      setTempTimeValue('');
      return;
    }

    // Parse the time value (format: HH:MM:SS)
    const parts = tempTimeValue.split(':').map(p => parseInt(p) || 0);
    let totalMinutes = 0;
    
    if (parts.length === 3) {
      // HH:MM:SS format
      totalMinutes = parts[0] * 60 + parts[1] + (parts[2] / 60);
    }

    // Calculate what the race start time should be to result in this remaining time
    const totalRaceMinutes = raceConfig.raceLengthHours * 60;
    const elapsedMinutes = totalRaceMinutes - totalMinutes;
    const newStartTime = new Date(currentTime.getTime() - (elapsedMinutes * 60000));
    
    setRaceStartTime(newStartTime);
    
    // Also adjust all team stint start times by the same amount
    if (raceStartTime) {
      const timeDifference = newStartTime.getTime() - raceStartTime.getTime();
      setTeamStates(prev => prev.map(team => ({
        ...team,
        stintStartTime: team.stintStartTime ? new Date(team.stintStartTime.getTime() + timeDifference) : null,
        lastPitTime: team.lastPitTime ? new Date(team.lastPitTime.getTime() + timeDifference) : null
      })));
    }

    setShowRaceTimeModal(false);
    setTempTimeValue('');
  };

  const openFuelRangeModal = () => {
    setTempFuelRangeValue(raceConfig.fuelRangeMinutes.toString());
    setShowFuelRangeModal(true);
  };

  const saveFuelRange = () => {
    const newFuelRange = parseInt(tempFuelRangeValue);
    
    if (!newFuelRange || newFuelRange < 30 || newFuelRange > 300) {
      alert('Please enter a valid fuel range between 30 and 300 minutes');
      return;
    }

    // Update the race configuration
    setRaceConfig(prev => ({
      ...prev,
      fuelRangeMinutes: newFuelRange
    }));

    // Recalculate stint plans for all teams with the new fuel range
    setTimeout(() => {
      setTeamStates(prev => prev.map((team, index) => ({
        ...team,
        stints: recalculateStintPlan(index)
      })));
    }, 100);

    setShowFuelRangeModal(false);
    setTempFuelRangeValue('');
  };

  const openStintTimeModal = (stintIndex, field, type) => {
    const stint = currentTeam.stints[stintIndex];
    let currentValue = '';
    
    if (field === 'start') {
      currentValue = type === 'planned' ? stint.plannedStart : stint.actualStart;
    } else if (field === 'finish') {
      currentValue = type === 'planned' ? stint.plannedFinish : stint.actualFinish;
    }
    
    if (currentValue) {
      // Format as HH:MM:SS for the input
      setTempTimeValue(currentValue.toLocaleTimeString('en-US', { hour12: false }));
    } else {
      setTempTimeValue('');
    }
    
    setEditingStint({ index: stintIndex, field, type });
    setShowStintTimeModal(true);
  };

  const saveStintTime = () => {
    if (!tempTimeValue || editingStint.index === null) {
      setShowStintTimeModal(false);
      setTempTimeValue('');
      setEditingStint({ index: null, field: null, type: null });
      return;
    }

    // Parse time input (HH:MM:SS format)
    const timeParts = tempTimeValue.split(':');
    if (timeParts.length !== 3) {
      alert('Please enter time in HH:MM:SS format');
      return;
    }

    const hours = parseInt(timeParts[0]) || 0;
    const minutes = parseInt(timeParts[1]) || 0;
    const seconds = parseInt(timeParts[2]) || 0;

    // Create new date with today's date and the specified time
    const today = new Date();
    const newTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes, seconds);

    // Update the specific stint time
    setTeamStates(prev => prev.map((team, teamIndex) => {
      if (teamIndex !== selectedTeam) return team;
      
      const updatedStints = [...team.stints];
      const stint = { ...updatedStints[editingStint.index] };
      
      const fieldName = editingStint.type === 'planned' 
        ? (editingStint.field === 'start' ? 'plannedStart' : 'plannedFinish')
        : (editingStint.field === 'start' ? 'actualStart' : 'actualFinish');
      
      stint[fieldName] = newTime;
      
      // If we're editing the actual start time of the active stint, update the team's stint start time
      if (editingStint.field === 'start' && editingStint.type === 'actual' && stint.status === 'active') {
        team = { ...team, stintStartTime: newTime };
      }
      
      updatedStints[editingStint.index] = stint;
      
      return {
        ...team,
        stints: updatedStints
      };
    }));

    setShowStintTimeModal(false);
    setTempTimeValue('');
    setEditingStint({ index: null, field: null, type: null });
  };

  const getStintTimeModalTitle = () => {
    if (!editingStint.field || !editingStint.type) return 'Edit Time';
    
    const fieldName = editingStint.field === 'start' ? 'Start' : 'Finish';
    const typeName = editingStint.type === 'planned' ? 'Planned' : 'Actual';
    
    return `Edit ${typeName} ${fieldName} Time`;
  };

  const cancelModal = () => {
    setShowElapsedModal(false);
    setShowRemainingModal(false);
    setShowRaceTimeModal(false);
    setShowFuelRangeModal(false);
    setShowStintTimeModal(false);
    setTempTimeValue('');
    setTempFuelRangeValue('');
    setEditingStint({ index: null, field: null, type: null });
  };

  const currentTeam = teamStates[selectedTeam];
  const currentStint = currentTeam?.stints?.[currentTeam.currentStint - 1];

  if (!raceStarted) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100">
        <div className="max-w-6xl mx-auto p-6">
          <div className="bg-gray-800 rounded-xl shadow-2xl p-8 border border-gray-700">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-blue-600 rounded-full">
                <Settings className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-white">Race Configuration</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label htmlFor="track-name" className="block text-sm font-medium text-gray-300 mb-3">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Track Name
                </label>
                <input
                  id="track-name"
                  type="text"
                  value={raceConfig.track}
                  onChange={(e) => setRaceConfig(prev => ({ ...prev, track: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter track name..."
                />
              </div>

              <div>
                <label htmlFor="race-length" className="block text-sm font-medium text-gray-300 mb-3">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Race Length (hours)
                </label>
                <input
                  id="race-length"
                  type="number"
                  value={raceConfig.raceLengthHours}
                  onChange={(e) => setRaceConfig(prev => ({ ...prev, raceLengthHours: parseInt(e.target.value) || 24 }))}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  min="1"
                  max="24"
                />
              </div>

              <div>
                <label htmlFor="fuel-range" className="block text-sm font-medium text-gray-300 mb-3">
                  <Fuel className="w-4 h-4 inline mr-2" />
                  Fuel Range (minutes)
                </label>
                <input
                  id="fuel-range"
                  type="number"
                  value={raceConfig.fuelRangeMinutes}
                  onChange={(e) => setRaceConfig(prev => ({ ...prev, fuelRangeMinutes: parseInt(e.target.value) || 108 }))}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  min="30"
                  max="180"
                />
              </div>

              <div>
                <label htmlFor="min-pit-time" className="block text-sm font-medium text-gray-300 mb-3">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Minimum Pit Time (seconds)
                </label>
                <input
                  id="min-pit-time"
                  type="number"
                  value={raceConfig.minPitTimeSeconds}
                  onChange={(e) => setRaceConfig(prev => ({ ...prev, minPitTimeSeconds: parseInt(e.target.value) || 170 }))}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  min="60"
                  max="600"
                />
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <label className="block text-sm font-medium text-gray-300">
                  <Users className="w-4 h-4 inline mr-2" />
                  Teams ({raceConfig.teams.length})
                </label>
                <button
                  onClick={addTeam}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium shadow-lg hover:shadow-blue-500/25"
                >
                  Add Team
                </button>
              </div>

              <div className="space-y-6">
                {raceConfig.teams.map((team, teamIndex) => (
                  <div key={teamIndex} className="border border-gray-600 rounded-xl p-6 bg-gray-750">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold text-white">Team {teamIndex + 1}</h3>
                      {raceConfig.teams.length > 1 && (
                        <button
                          onClick={() => deleteTeam(teamIndex)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-red-500/25"
                          title="Delete team"
                        >
                          Delete Team
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label htmlFor={`team-number-${teamIndex}`} className="block text-sm font-medium text-gray-300 mb-2">Team Number</label>
                        <input
                          id={`team-number-${teamIndex}`}
                          type="text"
                          value={team.number}
                          onChange={(e) => updateTeam(teamIndex, 'number', e.target.value)}
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="#3"
                        />
                      </div>
                      <div>
                        <label htmlFor={`team-name-${teamIndex}`} className="block text-sm font-medium text-gray-300 mb-2">Team Name</label>
                        <input
                          id={`team-name-${teamIndex}`}
                          type="text"
                          value={team.name}
                          onChange={(e) => updateTeam(teamIndex, 'name', e.target.value)}
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Apex Twin Racing"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <label className="block text-sm font-medium text-gray-300">Drivers</label>
                        <button
                          onClick={() => addDriver(teamIndex)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-green-500/25"
                        >
                          Add Driver
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {team.drivers.map((driver, driverIndex) => (
                          <div key={driverIndex} className="flex items-center gap-3">
                            <input
                              id={`driver-${teamIndex}-${driverIndex}`}
                              type="text"
                              value={driver}
                              onChange={(e) => updateDriver(teamIndex, driverIndex, e.target.value)}
                              className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                              placeholder={`Driver ${driverIndex + 1}`}
                              aria-label={`Driver ${driverIndex + 1} for Team ${teamIndex + 1}`}
                            />
                            {team.drivers.length > 1 && (
                              <button
                                onClick={() => deleteDriver(teamIndex, driverIndex)}
                                className="px-3 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-red-500/25"
                                title="Delete driver"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={startRace}
                disabled={!raceConfig.track || raceConfig.teams.some(team => !team.number || !team.name)}
                className="px-10 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-3 text-lg font-semibold shadow-xl hover:shadow-green-500/25 disabled:shadow-none"
              >
                <Play className="w-6 h-6" />
                Start Race
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-gray-800 rounded-xl shadow-2xl p-6 mb-6 border border-gray-700">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">{raceConfig.track}</h1>
              <p className="text-gray-300 text-lg">24-Hour Endurance Race</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-400">Time Remaining</div>
                <div 
                  className="text-2xl font-mono cursor-pointer hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors text-white"
                  onClick={openRaceTimeModal}
                  title="Click to edit race time"
                >
                  {formatRaceTime(getRemainingRaceTime())}
                </div>
              </div>

              {racePaused && (
                <div className="text-right">
                  <div className="text-sm text-red-400">PAUSED</div>
                  <div className="text-xl font-mono text-red-400">
                    {formatRaceTime((Date.now() - pausedTime) / 60000)}
                  </div>
                </div>
              )}
              
              <button
                onClick={pauseRace}
                className={`px-6 py-3 rounded-xl flex items-center gap-2 font-semibold transition-all duration-200 shadow-lg ${
                  racePaused 
                    ? 'bg-green-600 text-white hover:bg-green-700 hover:shadow-green-500/25' 
                    : 'bg-yellow-600 text-white hover:bg-yellow-700 hover:shadow-yellow-500/25'
                }`}
              >
                {racePaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                {racePaused ? 'Resume' : 'Pause'}
              </button>
              
              <button
                onClick={toggleFCY}
                className={`px-6 py-3 rounded-xl flex items-center gap-2 font-semibold transition-all duration-200 shadow-lg ${
                  fcyActive 
                    ? 'bg-yellow-500 text-black hover:bg-yellow-600 hover:shadow-yellow-500/25' 
                    : 'bg-gray-600 text-white hover:bg-gray-700 hover:shadow-gray-500/25'
                }`}
              >
                <Flag className="w-5 h-5" />
                {fcyActive ? 'FCY ACTIVE' : 'FCY'}
              </button>
              
              <button
                onClick={stopRace}
                className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-red-500/25"
              >
                <RotateCcw className="w-5 h-5" />
                Stop Race
              </button>
            </div>
          </div>
        </div>

        {/* Team Selection */}
        <div className="bg-gray-800 rounded-xl shadow-2xl p-6 mb-6 border border-gray-700">
          <div className="flex flex-wrap gap-3">
            {raceConfig.teams.map((team, index) => (
              <div key={index} className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedTeam(index)}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg ${
                    selectedTeam === index
                      ? 'bg-blue-600 text-white shadow-blue-500/25'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                  }`}
                >
                  #{team.number} - {team.name}
                </button>
                <button
                  onClick={() => executePit(index)}
                  className="px-4 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-all duration-200 text-sm font-semibold shadow-lg hover:shadow-orange-500/25"
                  title={`Pit stop for team ${team.number}`}
                >
                  PIT
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Current Stint Status */}
        {currentTeam && raceConfig.teams[selectedTeam] && (
          <div className="bg-gray-800 rounded-xl shadow-2xl p-8 mb-6 border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-6">
              #{raceConfig.teams[selectedTeam].number} - {raceConfig.teams[selectedTeam].name}
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-8">
              <div className="bg-gray-700 p-4 rounded-xl border border-gray-600">
                <div className="text-sm text-gray-400 mb-2">Current Stint</div>
                <div className="text-3xl font-bold text-white">{currentTeam.currentStint}</div>
              </div>
              
              <div className="bg-green-900/50 p-4 rounded-xl border border-green-700">
                <div className="text-sm text-green-300 mb-2">Stint Elapsed</div>
                <div 
                  className="text-xl font-bold text-green-400 cursor-pointer hover:bg-green-800/50 px-3 py-2 rounded-lg transition-colors"
                  onClick={openElapsedModal}
                  title="Click to edit"
                >
                  {formatDurationToHMS(currentTeam.stintStartTime ? getElapsedTime(currentTeam.stintStartTime) : 0)}
                </div>
              </div>
              
              <div className="bg-orange-900/50 p-4 rounded-xl border border-orange-700">
                <div className="text-sm text-orange-300 mb-2">Stint Remaining</div>
                <div 
                  className="text-xl font-bold text-orange-400 cursor-pointer hover:bg-orange-800/50 px-3 py-2 rounded-lg transition-colors"
                  onClick={openRemainingModal}
                  title="Click to edit"
                >
                  {(() => {
                    if (!currentTeam || !currentStint) {
                      return "00:00:00";
                    }
                    
                    if (!currentTeam.stintStartTime) {
                      return formatDurationToHMS(currentStint.plannedLength);
                    }
                    
                    const remaining = getRemainingTime(currentTeam.stintStartTime, currentStint.plannedLength);
                    return formatDurationToHMS(remaining);
                  })()}
                </div>
              </div>
              
              <div className="bg-blue-900/50 p-4 rounded-xl border border-blue-700">
                <div className="text-sm text-blue-300 mb-2">Predicted # of Stints</div>
                <div className="text-xl font-bold text-blue-400">{currentTeam.stints.length}</div>
              </div>
              
              <div className={`p-4 rounded-xl border ${
                calculateFCYBuffer(selectedTeam).showGreen 
                  ? 'bg-green-900/50 border-green-700' 
                  : 'bg-red-900/50 border-red-700'
              }`}>
                <div className="text-sm text-gray-300 mb-2">FCY Buffer</div>
                <div className={`text-xl font-bold ${
                  calculateFCYBuffer(selectedTeam).showGreen ? 'text-green-400' : 'text-red-400'
                }`}>
                  {(() => {
                    if (!currentTeam || !currentTeam.stintStartTime) {
                      return '00:00:00';
                    }
                    
                    const elapsed = getElapsedTime(currentTeam.stintStartTime);
                    const maxStintLength = raceConfig.fuelRangeMinutes;
                    const fcyWindowOpensAt = maxStintLength - 20;
                    
                    if (elapsed >= fcyWindowOpensAt) {
                      return 'PIT WINDOW OPEN';
                    } else {
                      const timeUntilWindow = fcyWindowOpensAt - elapsed;
                      return formatDurationToHMS(timeUntilWindow);
                    }
                  })()}
                </div>
              </div>
            </div>

            {/* Race Settings Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-purple-900/50 p-4 rounded-xl border border-purple-700">
                <div className="text-sm text-purple-300 mb-2">Max Fuel Range</div>
                <div 
                  className="text-xl font-bold text-purple-400 cursor-pointer hover:bg-purple-800/50 px-3 py-2 rounded-lg transition-colors"
                  onClick={openFuelRangeModal}
                  title="Click to edit fuel range"
                >
                  {raceConfig.fuelRangeMinutes} min
                </div>
              </div>
              
              <div className="bg-gray-700 p-4 rounded-xl border border-gray-600">
                <div className="text-sm text-gray-400 mb-2">Min Pit Time</div>
                <div className="text-xl font-bold text-gray-300">
                  {raceConfig.minPitTimeSeconds}s
                </div>
              </div>
              
              <div className="bg-gray-700 p-4 rounded-xl border border-gray-600">
                <div className="text-sm text-gray-400 mb-2">Race Length</div>
                <div className="text-xl font-bold text-gray-300">
                  {raceConfig.raceLengthHours}h
                </div>
              </div>
            </div>

            {/* FCY Alert */}
            {fcyActive && (
              <div className={`p-6 rounded-xl mb-6 border-2 ${
                canPitOnFCY(selectedTeam) 
                  ? 'bg-green-900/50 border-green-500' 
                  : 'bg-yellow-900/50 border-yellow-500'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-6 h-6 text-yellow-400" />
                    <span className="font-semibold text-white text-lg">
                      {canPitOnFCY(selectedTeam) 
                        ? 'PIT WINDOW OPEN - Recommend pit stop under FCY'
                        : 'FCY Active - Outside optimal pit window'
                      }
                    </span>
                  </div>
                  {canPitOnFCY(selectedTeam) && (
                    <button
                      onClick={executePit}
                      className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-green-500/25"
                    >
                      PIT NOW
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Current Driver */}
            <div className="mb-6">
              <div className="text-sm text-gray-400 mb-2">Current Driver</div>
              <div className="text-xl font-semibold text-white">
                {raceConfig.teams[selectedTeam]?.drivers?.[currentTeam.currentDriver] || 'Not assigned'}
              </div>
            </div>
          </div>
        )}

        {/* Modals */}
        {/* Stint Time Edit Modal */}
        {showStintTimeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-700">
              <h3 className="text-2xl font-bold text-white mb-6">{getStintTimeModalTitle()}</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Time (HH:MM:SS)</label>
                  <input
                    type="text"
                    value={tempTimeValue}
                    onChange={(e) => setTempTimeValue(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="HH:MM:SS"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveStintTime();
                      if (e.key === 'Escape') cancelModal();
                    }}
                    autoFocus
                  />
                  <p className="text-sm text-gray-400 mt-2">
                    {editingStint.type === 'actual' && editingStint.field === 'start' 
                      ? 'Note: Editing actual start time will affect stint timing calculations'
                      : 'Enter time in 24-hour format (HH:MM:SS)'
                    }
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-8">
                <button
                  onClick={cancelModal}
                  className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={saveStintTime}
                  className={`px-6 py-3 rounded-xl transition-all duration-200 font-semibold text-white shadow-lg ${
                    editingStint.type === 'planned' 
                      ? 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500/25' 
                      : 'bg-green-600 hover:bg-green-700 hover:shadow-green-500/25'
                  }`}
                >
                  Update Time
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Elapsed Time Edit Modal */}
        {showElapsedModal && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-700">
              <h3 className="text-2xl font-bold text-white mb-6">Edit Stint Elapsed Time</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Elapsed Time (HH:MM:SS)</label>
                  <input
                    type="text"
                    value={tempTimeValue}
                    onChange={(e) => setTempTimeValue(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="HH:MM:SS"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveElapsedTime();
                      if (e.key === 'Escape') cancelModal();
                    }}
                    autoFocus
                  />
                  <p className="text-sm text-gray-400 mt-2">
                    Adjust how much time has elapsed in the current stint
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-8">
                <button
                  onClick={cancelModal}
                  className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={saveElapsedTime}
                  className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-green-500/25"
                >
                  Update Elapsed Time
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Remaining Time Edit Modal */}
        {showRemainingModal && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-700">
              <h3 className="text-2xl font-bold text-white mb-6">Edit Stint Remaining Time</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Remaining Time (HH:MM:SS)</label>
                  <input
                    type="text"
                    value={tempTimeValue}
                    onChange={(e) => setTempTimeValue(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="HH:MM:SS"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveRemainingTime();
                      if (e.key === 'Escape') cancelModal();
                    }}
                    autoFocus
                  />
                  <p className="text-sm text-gray-400 mt-2">
                    Adjust how much time remains in the current stint
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-8">
                <button
                  onClick={cancelModal}
                  className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={saveRemainingTime}
                  className="px-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-orange-500/25"
                >
                  Update Remaining Time
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Fuel Range Edit Modal */}
        {showFuelRangeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-700">
              <h3 className="text-2xl font-bold text-white mb-6">Edit Max Fuel Range</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Fuel Range (minutes)</label>
                  <input
                    type="number"
                    value={tempFuelRangeValue}
                    onChange={(e) => setTempFuelRangeValue(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="108"
                    min="30"
                    max="300"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveFuelRange();
                      if (e.key === 'Escape') cancelModal();
                    }}
                    autoFocus
                  />
                  <p className="text-sm text-gray-400 mt-2">
                    Maximum stint length in minutes (30-300). This will recalculate all stint plans.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-8">
                <button
                  onClick={cancelModal}
                  className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={saveFuelRange}
                  className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-purple-500/25"
                >
                  Update Fuel Range
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Race Time Edit Modal */}
        {showRaceTimeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-700">
              <h3 className="text-2xl font-bold text-white mb-6">Edit Race Time Remaining</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Time Remaining (HH:MM:SS)</label>
                  <input
                    type="text"
                    value={tempTimeValue}
                    onChange={(e) => setTempTimeValue(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="HH:MM:SS"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveRaceTime();
                      if (e.key === 'Escape') cancelModal();
                    }}
                    autoFocus
                  />
                  <p className="text-sm text-gray-400 mt-2">
                    Adjust to match official race timing system
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-8">
                <button
                  onClick={cancelModal}
                  className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={saveRaceTime}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-blue-500/25"
                >
                  Update Race Time
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pit Stop Dialog */}
        {showPitDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-700">
              <h3 className="text-2xl font-bold text-white mb-6">Confirm Pit Stop</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Reason for Pit Stop</label>
                  <select
                    value={pitReason}
                    onChange={(e) => setPitReason(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="scheduled">Scheduled Stop</option>
                    <option value="fcyOpportunity">FCY Opportunity</option>
                    <option value="unscheduled">Unscheduled Stop</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Fuel Taken?</label>
                  <div className="flex gap-6">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="fuel"
                        checked={fuelTaken === true}
                        onChange={() => setFuelTaken(true)}
                        className="mr-3 w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500"
                      />
                      <span className="text-white">Yes</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="fuel"
                        checked={fuelTaken === false}
                        onChange={() => setFuelTaken(false)}
                        className="mr-3 w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500"
                      />
                      <span className="text-white">No</span>
                    </label>
                  </div>
                  {!fuelTaken && (
                    <p className="text-sm text-orange-400 mt-2">
                      Note: Stint timer will continue if no fuel is taken
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Driver Changed?</label>
                  <div className="flex gap-6">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="driverChanged"
                        checked={driverChanged === true}
                        onChange={() => setDriverChanged(true)}
                        className="mr-3 w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500"
                      />
                      <span className="text-white">Yes</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="driverChanged"
                        checked={driverChanged === false}
                        onChange={() => setDriverChanged(false)}
                        className="mr-3 w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500"
                      />
                      <span className="text-white">No</span>
                    </label>
                  </div>
                </div>

                {driverChanged && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">New Driver</label>
                    <select
                      value={selectedDriverIndex}
                      onChange={(e) => setSelectedDriverIndex(parseInt(e.target.value))}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      {raceConfig.teams[selectedTeam]?.drivers.map((driver, index) => (
                        <option key={index} value={index}>
                          {driver || `Driver ${index + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-4 mt-8">
                <button
                  onClick={() => setShowPitDialog(false)}
                  className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmPitStop}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-blue-500/25"
                >
                  Confirm Pit Stop
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stint Schedule */}
        {currentTeam && (
          <div className="bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-700">
            <div className="p-6 bg-gray-750 border-b border-gray-700">
              <h3 className="text-xl font-semibold text-white">Stint Schedule</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-750">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Stint #</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Planned Start</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actual Start</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Planned Finish</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actual Finish</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Planned Length</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actual Length</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Planned Pit</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Fuel Taken</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Driver Changed</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Driver</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {currentTeam.stints.map((stint, index) => (
                    <tr 
                      key={index}
                      className={`${
                        stint.status === 'active' ? 'bg-blue-900/30' : 
                        stint.status === 'completed' ? 'bg-green-900/30' : 'bg-gray-800'
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        {stint.stintNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        <span 
                          className="cursor-pointer hover:bg-blue-800/50 px-3 py-2 rounded-lg transition-colors"
                          onClick={() => openStintTimeModal(index, 'start', 'planned')}
                          title="Click to edit planned start time"
                        >
                          {formatTime(stint.plannedStart)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        <span 
                          className="cursor-pointer hover:bg-green-800/50 px-3 py-2 rounded-lg transition-colors"
                          onClick={() => openStintTimeModal(index, 'start', 'actual')}
                          title="Click to edit actual start time"
                        >
                          {formatTime(stint.actualStart)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        <span 
                          className="cursor-pointer hover:bg-blue-800/50 px-3 py-2 rounded-lg transition-colors"
                          onClick={() => openStintTimeModal(index, 'finish', 'planned')}
                          title="Click to edit planned finish time"
                        >
                          {formatTime(stint.plannedFinish)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        <span 
                          className="cursor-pointer hover:bg-green-800/50 px-3 py-2 rounded-lg transition-colors"
                          onClick={() => openStintTimeModal(index, 'finish', 'actual')}
                          title="Click to edit actual finish time"
                        >
                          {formatTime(stint.actualFinish)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {formatDurationToHMS(stint.plannedLength)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {stint.calculatedLength ? formatDurationToHMS(stint.calculatedLength) : '00:00:00'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {stint.pitTime}s
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {stint.fuelTaken === null ? '--' : stint.fuelTaken ? 'Yes' : 'No'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {stint.driverChanged === null || stint.driverChanged === undefined ? '--' : stint.driverChanged ? 'Yes' : 'No'}
                      </td>
                      <td 
                        className={`px-6 py-4 whitespace-nowrap text-sm text-gray-300 ${
                          dragOverIndex === index ? 'bg-blue-800/50' : ''
                        }`}
                        draggable
                        onDragStart={(e) => handleDriverDragStart(e, index)}
                        onDragOver={handleDriverDragOver}
                        onDragEnter={(e) => handleDriverDragEnter(e, index)}
                        onDragLeave={handleDriverDragLeave}
                        onDrop={(e) => handleDriverDrop(e, index)}
                      >
                        <div className="flex items-center gap-2 cursor-move">
                          <GripVertical className="w-4 h-4 text-gray-500" />
                          {getDriverForStint(index, selectedTeam)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          stint.status === 'active' ? 'bg-blue-900/50 text-blue-300 border border-blue-600' :
                          stint.status === 'completed' ? 
                            (stint.pitReason === 'unscheduled' ? 'bg-red-900/50 text-red-300 border border-red-600' : 
                             stint.pitReason === 'fcyOpportunity' ? 'bg-yellow-900/50 text-yellow-300 border border-yellow-600' :
                             'bg-green-900/50 text-green-300 border border-green-600') :
                          'bg-gray-700 text-gray-300 border border-gray-600'
                        }`}>
                          {stint.status === 'completed' && stint.pitReason ? stint.pitReason : stint.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PitStrategyApp;