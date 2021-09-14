import { useEffect, useState } from 'react';
import { Route, Switch } from 'react-router-dom';
import Main from './Main';
import ImagePopup from './ImagePopup';
import EditProfilePopup from './EditProfilePopup';
import EditAvatarPopup from './EditAvatarPopup';
import AddPlacePopup from './AddPlacePopup';
import InfoTooltip from './InfoTooltip';
import Register from './Register';
import Login from './Login';
import ProtectedRoute from './ProtectedRoute';
import api from '../utils/api';
import auth from '../utils/auth';
import { AppContext } from '../contexts/AppContext';
import { appRoutes } from '../utils/constants';
import { useHistory } from 'react-router-dom';

function App() {
  const hst = useHistory();

  const [currentUser, setCurrentUser] = useState({});
  const [currentEmail, setCurrentEmail] = useState('');
  const [cards, setCards] = useState([]);

  const [isPopupProfileOpen, setIsPopupProfileOpen] = useState(false);
  const [isPopupCardOpen, setIsPopupCardOpen] = useState(false);
  const [isPopupAvatarOpen, setIsPopupAvatarOpen] = useState(false);
  const [isInfoTooltipOpen, setIsInfoTooltipOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [isError, setIsError] = useState(false);

  const handleButtonEditProfileClick = () => setIsPopupProfileOpen(true);
  const handleButtonAddCardClick = () => setIsPopupCardOpen(true);
  const handleButtonEditAvatarClick = () => setIsPopupAvatarOpen(true);

  const closeAllPopups = () => {
    setIsPopupProfileOpen(false);
    setIsPopupCardOpen(false);
    setIsPopupAvatarOpen(false);
    setIsInfoTooltipOpen(false);
    setSelectedCard(null);
  }

  const showInfoToolTip = (isError) => {
    setIsError(isError);
    setIsInfoTooltipOpen(true);
  };

  useEffect(() => {
    const promises = [api.getUserInfo(), api.getInitialCards()];

    Promise.all(promises)
      .then(([userInfo, initialCards]) => {
        setCurrentUser(userInfo);
        setCards(initialCards);
      })
      .catch(err => console.log(err));
  }, []);

  useEffect(() => {
    const jwt = localStorage.getItem('jwt');

    if (jwt) {
      auth.getContent(jwt)
      .then((authInfo) => {
        setCurrentEmail(authInfo.data.email);

        setLoggedIn(true);
        hst.push(appRoutes.root);
      })
      .catch(() => showInfoToolTip(true));
    }
  }, [hst]);

  const handleLogin = () => {
    setLoggedIn(true);
  }

  const handleLogout = () => {
    setLoggedIn(false);
  }

  const handleCardLike = (card) => {
    const isLiked = card.likes.some(like => like._id === currentUser._id);

    api.changeCardLikeStatus(card._id, isLiked)
      .then(newCard => {
        setCards(cards => cards.map(currCard => currCard._id === card._id ? newCard : currCard));
      })
      .catch(err => console.log(err));
  }

  const handleCardDelete = (card) => {
    api.deleteCard(card._id)
      .then(() => {
        setCards(cards.filter(currCard => currCard._id !== card._id))
      })
      .catch(err => console.log(err));
  }

  const handleUpdateUser = ({name, about}) => {
    api.setUserInfo(name, about)
    .then(userInfo => {
      setCurrentUser(userInfo);
      closeAllPopups();
    })
    .catch(err => console.log(err));
  }

  const handleUpdateAvatar = (avatar) => {
    api.setUserAvatar(avatar)
      .then(userInfo => {
        setCurrentUser(userInfo);
        closeAllPopups();
      })
      .catch(err => console.log(err));
  }

  const handleAddCard = ({name, link}) => {
    api.addCard(name, link)
      .then(newCard => {
        setCards([newCard, ...cards]);
        closeAllPopups();
      })
      .catch(err => console.log(err));
  }

  return (
    <AppContext.Provider value={{currentUser, currentEmail, loggedIn, showInfoToolTip, handleLogin, handleLogout}}>
      <Switch>
        <ProtectedRoute
          exact
          path={appRoutes.root}
          loggedIn={loggedIn}
          cards={cards}
          onEditProfile={handleButtonEditProfileClick}
          onAddCard={handleButtonAddCardClick}
          onEditAvatar={handleButtonEditAvatarClick}
          onCardClick={setSelectedCard}
          onCardLike={handleCardLike}
          onCardDelete={handleCardDelete}
          component={Main}
        />
        <Route exact path={appRoutes.signUp}>
          <Register />
        </Route>
        <Route exact path={appRoutes.signIn}>
          <Login />
        </Route>
      </Switch>

      <EditProfilePopup
        isOpen={isPopupProfileOpen}
        onClose={closeAllPopups}
        onUpdateUser={handleUpdateUser}
      />

      <AddPlacePopup
        isOpen={isPopupCardOpen}
        onClose={closeAllPopups}
        onAddCard={handleAddCard}
      />

      <EditAvatarPopup
        isOpen={isPopupAvatarOpen}
        onClose={closeAllPopups}
        onUpdateAvatar={handleUpdateAvatar}
      />

      <ImagePopup
        card={selectedCard}
        onClose={closeAllPopups}
      />

      <InfoTooltip
        isOpen={isInfoTooltipOpen}
        isError={isError}
        onClose={closeAllPopups}
      />
    </AppContext.Provider>
  );
}

export default App;
