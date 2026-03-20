import { Game } from '../data/mockGames';

// Toast notification functions
let toastSuccess: (message: string) => void;
let toastError: (message: string) => void;
let toastWarning: (message: string) => void;
let toastInfo: (message: string) => void;

export const setToastFunctions = (success: any, error: any, warning: any, info: any) => {
  toastSuccess = success;
  toastError = error;
  toastWarning = warning;
  toastInfo = info;
};

// Validation functions
export const validateGameForm = (gameData: Partial<Game>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!gameData.title || gameData.title.trim().length < 3) {
    errors.push('اسم اللعبة مطلوب ويجب أن يكون 3 أحرف على الأقل');
  }
  
  if (!gameData.price || gameData.price <= 0) {
    errors.push('السعر مطلوب ويجب أن يكون أكبر من صفر');
  }
  
  if (!gameData.description || gameData.description.trim().length < 10) {
    errors.push('الوصف مطلوب ويجب أن يكون 10 أحرف على الأقل');
  }
  
  if (!gameData.platform) {
    errors.push('منصة اللعبة مطلوبة');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// CRUD Operations
export const addGame = async (gameData: Partial<Game>, currentGames: Game[]): Promise<{ success: boolean; games: Game[]; message: string }> => {
  // Validate input
  const validation = validateGameForm(gameData);
  if (!validation.isValid) {
    toastError(validation.errors[0]);
    return { success: false, games: currentGames, message: validation.errors[0] };
  }
  
  try {
    // Create new game with ID
    const newGame: Game = {
      _id: Date.now().toString(),
      title: gameData.title!,
      description: gameData.description!,
      price: gameData.price!,
      platform: gameData.platform!,
      image: gameData.image || 'https://via.placeholder.com/300x200/6366F1/FFFFFF?text=New',
      images: gameData.images || [gameData.image || 'https://via.placeholder.com/300x200/6366F1/FFFFFF?text=New'],
      availability: gameData.availability || 'available',
      region: gameData.region || 'Global',
      category: gameData.category || 'general',
      originalPrice: gameData.originalPrice,
      discount: gameData.discount,
      isNew: true
    };
    
    // Add to games array
    const updatedGames = [...currentGames, newGame];
    
    toastSuccess('تمت إضافة اللعبة بنجاح!');
    return { success: true, games: updatedGames, message: 'تمت إضافة اللعبة بنجاح!' };
  } catch (error) {
    toastError('حدث خطأ أثناء إضافة اللعبة');
    return { success: false, games: currentGames, message: 'حدث خطأ أثناء إضافة اللعبة' };
  }
};

export const updateGamePrice = async (gameId: string, newPrice: number, currentGames: Game[]): Promise<{ success: boolean; games: Game[]; message: string }> => {
  // Validate price
  if (!newPrice || newPrice <= 0) {
    toastError('السعر يجب أن يكون أكبر من صفر');
    return { success: false, games: currentGames, message: 'السعر يجب أن يكون أكبر من صفر' };
  }
  
  try {
    // Find and update game
    const updatedGames = currentGames.map(game => 
      game._id === gameId ? { ...game, price: newPrice } : game
    );
    
    const game = currentGames.find(g => g._id === gameId);
    toastSuccess(`تم تحديث سعر "${game?.title}" بنجاح!`);
    return { success: true, games: updatedGames, message: `تم تحديث السعر بنجاح!` };
  } catch (error) {
    toastError('حدث خطأ أثناء تحديث السعر');
    return { success: false, games: currentGames, message: 'حدث خطأ أثناء تحديث السعر' };
  }
};

export const addDiscount = async (gameId: string, discount: number, currentGames: Game[]): Promise<{ success: boolean; games: Game[]; message: string }> => {
  // Validate discount
  if (discount < 0 || discount > 100) {
    toastError('الخصم يجب أن يكون بين 0 و 100');
    return { success: false, games: currentGames, message: 'الخصم يجب أن يكون بين 0 و 100' };
  }
  
  try {
    // Find game and calculate original price
    const game = currentGames.find(g => g._id === gameId);
    if (!game) {
      toastError('اللعبة غير موجودة');
      return { success: false, games: currentGames, message: 'اللعبة غير موجودة' };
    }
    
    // Update with discount
    const updatedGames = currentGames.map(g => 
      g._id === gameId 
        ? { 
            ...g, 
            discount: discount,
            originalPrice: g.originalPrice || g.price,
            price: discount > 0 ? g.price * (1 - discount / 100) : g.originalPrice || g.price
          } 
        : g
    );
    
    toastSuccess(`تم إضافة خصم ${discount}% لـ "${game.title}" بنجاح!`);
    return { success: true, games: updatedGames, message: `تم إضافة الخصم بنجاح!` };
  } catch (error) {
    toastError('حدث خطأ أثناء إضافة الخصم');
    return { success: false, games: currentGames, message: 'حدث خطأ أثناء إضافة الخصم' };
  }
};

export const deleteGame = async (gameId: string, currentGames: Game[]): Promise<{ success: boolean; games: Game[]; message: string }> => {
  try {
    // Find game for message
    const game = currentGames.find(g => g._id === gameId);
    if (!game) {
      toastError('اللعبة غير موجودة');
      return { success: false, games: currentGames, message: 'اللعبة غير موجودة' };
    }
    
    // Remove game
    const updatedGames = currentGames.filter(g => g._id !== gameId);
    
    toastSuccess(`تم حذف "${game.title}" بنجاح!`);
    return { success: true, games: updatedGames, message: `تم حذف اللعبة بنجاح!` };
  } catch (error) {
    toastError('حدث خطأ أثناء حذف اللعبة');
    return { success: false, games: currentGames, message: 'حدث خطأ أثناء حذف اللعبة' };
  }
};

// Real-time sync simulation
export const syncWithFrontend = (games: Game[]) => {
  // In a real app, this would sync with backend
  // For now, we'll just update localStorage
  localStorage.setItem('adminGames', JSON.stringify(games));
  return games;
};

export const loadGamesFromStorage = (): Game[] => {
  try {
    const stored = localStorage.getItem('adminGames');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};
