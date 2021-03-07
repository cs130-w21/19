import React, {useReducer, useEffect} from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQuestionCircle as questionIcon } from '@fortawesome/free-regular-svg-icons';
import JoyRide, {ACTIONS, EVENTS, STATUS} from 'react-joyride';

const tutorial_steps = [
    {
        target: ".tutorial-step-1",
        content: 
        "Search for a stock by ticker or company name, and let the magic unfold! When you are done, you will find the stock chart for the desired ticker below. Then, follow the beacon for next steps. "

    },
    {
        target: ".tutorial-step-2",
        content: "Great! At this point, you may analyze the chart, and add the current ticker to your watchlist by clicking on the star icon. The watchlisted stock should then appear in your watchlist below!"
    },
    {
        target: ".tutorial-step-3",
        content: "Good Job! You now know how to search for a stock and add it to your watchlist. Let's now look at how you can start trading :) Using this feature, you can either buy or sell stocks. You start out with $75,000, so make sure you don't exceed that limit. Enter the amount you would like to buy or sell, and execute your order by clicking on the 'buy/sell unit..' button. Your purchased stock will then be available for you to see in your portfolio! More on that later. Try this out, and I'll see you at the next stop! " 
    },
    {
        target: ".tutorial-step-4",
        content: "You're getting the hang of this! You should now be able to see items in your watchlist and portfolio if you followed the previous steps correctly. Click on Portfolio to view your recently purchased stock."
    },
    {
        target: ".tutorial-step-4",
        content: "Awesome, this table should now show the stock you purchased moments ago! Move to the Profile page for more insights on your portfolio and trading history"
    },
]

const tutorial_steps2 = [
    {
        target: ".tutorial2-step-1",
        content: "This is your porfolio table showing all the stocks you've purchased, the number of shares you own and their current value! For some insights, take a look at your Portfolio Growth chart (first tab below), and see your trading performance. Use this chart to improve your future strategies. Additionally, if you like pictorial representations, take a look at the Portfolio Distribution tab :') When you're done, switch to the Trading History tab. See you there!"
    },
    {
        target: ".tutorial2-step-1",
        content: "This is your history on Stonks, showing information on all the purchases and sales you've made on this account. Alright, that's all you need to know to get started! If any of this was confusing, don't worry! You can restart the tutorial by clicking on the '?' icon in the navigation bar above. We hope you enjoy your experience at Stonks :)"
    },
]

const initial_state = {
    key: new Date(),
    run: false,
    continuous: true,
    loading: false,
    stepIndex: 0,
}
const reducer = (state = initial_state, action) => {
    switch (action.type) {
      case "START":
        return { ...state, run: true };
      case "RESET":
        return { ...state, stepIndex: 0 };
      case "STOP":
        return { ...state, run: false };
      case "NEXT_OR_PREV":
        return { ...state, ...action.payload };
      case "RESTART":
        return {
          ...state,
          stepIndex: 0,
          run: true,
          loading: false,
          key: new Date()
        };
      default:
        return state;
    }
  };

const Tutorial = ({ isProfile }) => {
    const [state, dispatch] = useReducer(reducer, initial_state);
    useEffect(() => {
        if(isProfile){
            if(!localStorage.getItem("tutorial2")){
                dispatch({type: "START"});
            }
        }
        else{
            if(!localStorage.getItem("tutorial")){
                dispatch({type: "START"});
            }
        }

        if(localStorage.getItem('show_tutorial_first_time')) {
          localStorage.removeItem('show_tutorial_first_time');
          //really bad hacky way to do it, but i couldnt think of any other. We need to wait until all
          // DOM elements of the main page are ready so that the css selectors can work?
          setTimeout(() => dispatch({type: "RESTART"}), 2000);
        }
    }, []);
    

    const setViewed = () => {
        if(isProfile){
            localStorage.setItem("tutorial2", "1");
        }
        else{
            localStorage.setItem("tutorial", "1");
        }
        
    }

    const callback = data => {
        const { action, index, type, status } = data;
        if (
            status === STATUS.FINISHED
          ) {
            setViewed();
            dispatch({ type: "STOP" });
          } else if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
            setViewed();
            dispatch({
              type: "NEXT_OR_PREV",
              payload: { stepIndex: index + (action === ACTIONS.PREV ? -1 : 1) }
            });
          }
        };

       
        const toggleTutorialMode = () => {
            if(!state.run){
                dispatch({type: "RESTART"});
            }
            else{
                dispatch({type: "STOP"});
            }
        }

  
    return (
        <>
          <OverlayTrigger
            trigger={["hover", "focus"]}
            placement="bottom"
            overlay={
              <Popover>Click me to launch the interactive tutorial!</Popover>
            }
          >
            <FontAwesomeIcon
              icon={questionIcon}
              style={{ cursor: 'pointer', color: '#ffff00a6',fontSize: '1.3em', marginTop:'0.5em', marginRight: '0.8em' }} 
              onClick={toggleTutorialMode} 
            />
          </OverlayTrigger>
            <JoyRide 
            {...state}
            callback={callback}
            steps={isProfile? tutorial_steps2: tutorial_steps} 
            showSkipButton={true}  
            locale={{
                last: "End Tutorial",
                skip: "Close"
            }}
            styles={{
            buttonNext: {
                backgroundColor: "green"
              },
              tooltipContainer: {
                textAlign: "left"
              },
            }}
            options={{
                arrowColor: '#e3ffeb',
                backgroundColor: '#e3ffeb',
                overlayColor: 'rgba(79, 26, 0, 0.4)',
                primaryColor: '#000',
                textColor: '#004a14',
                width: 200,
                zIndex: 400,
              }}
            />
        </>
    )
}
export default Tutorial;
