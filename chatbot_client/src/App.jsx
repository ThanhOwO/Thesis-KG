// src/App.js
import React from 'react';
import './App.scss';
import gptlogo from './assets/chatgpt.svg'
import addBtn from './assets/add-30.png'
import msgIcon from './assets/message.svg'
import home from './assets/home.svg'
import saved from './assets/bookmark.svg'
import rocket from './assets/rocket.svg'
import sendBtn from './assets/send.svg' 
import userIcon from './assets/user-icon.png'
import gptImgLogo from './assets/chatgptLogo.svg'

function App() {
  return (
    <div className='App'>
      <div className='sideBar'>
          <div className='upperSide'>
            <div className='upperSideTop'><img src={gptlogo} alt='Logo' className='logo'/><span className='brand'>My Chatbot</span></div>
            <button className='midBtn'><img src={addBtn} alt='new chat' className='addBtn'/> New Chat</button>
            <div className='upperSideBottom'>
              <button className='query'><img src={msgIcon} alt='Query'/>Hello how can I help you ?</button>
            </div>
          </div>
          <div className='lowerSide'>
            <div className='listItems'><img src={home} alt='' className='listItemsImg'/>Home</div>
            <div className='listItems'><img src={saved} alt='' className='listItemsImg'/>Save</div>
            <div className='listItems'><img src={rocket} alt='' className='listItemsImg'/>Upgrade to Pro</div>
          </div>
      </div>
      <div className='main'>
        <div className='chats'>
          <div className='chat'>
            <img className='chatImg' src={userIcon} alt='' /><p className='txt'>Hi this is a test message</p>
          </div>
          <div className='chat bot'>
            <img className='chatImg' src={gptImgLogo} alt='' /><p className='txt'>Loremsdoashdlndakjsldh saodhsajkldhsakjdhsa lkjsahdoiahfoiashd hdoisadhasoidhisldh chxzlkcnzxlkchjzxckl lkxzjckxzlcjzxklc lkjxzclkxzjcklxzcjxzklcjzxlk cxzlkcjzxkl czlxkjclkzx cjzlkxcjzxlk czxklcjzlkcj dsadddddddsadsadsad dssadasdsadfasdxcxzc xzc asdasd adac czx cqwdf c faasdasdasasd czxc sad </p>
          </div>
        </div>
        <div className='chatFooter'>
          <div className='inp'>
            <input type='text' placeholder='Send a message...'/><button className='send'><img src={sendBtn} alt='Send'/></button>
          </div>
          <p>My Chat can make mistakes. Consider checking important information.</p>
        </div>
      </div>
    </div>
  );
}

export default App;
