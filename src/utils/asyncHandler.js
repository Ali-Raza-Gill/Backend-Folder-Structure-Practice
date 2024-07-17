//Their is 2 methods to do this, we make this to use this in all required places where we want to use DB connections, i write both but here i use promise method.

//1st way is with Promise => with then and catch, here is this:
// I got error in this code, Error=>"requires callback function but got a object", so i resolved this error by returning this function, because this is higer order function, so higher order function will be returned.
const asyncHandler = (requsetHandler) => {
  return (req, res, next) => {
    Promise.resolve(requsetHandler(req, res, next)).catch((error) => {
      next(error);
    });
  };
};
export { asyncHandler };

// 2nd is try catch method i write both but here i use promise method

// const asyncHandler = () => {}; //simple arrow function
// const asyncHandler = (func) => {
//   () => {} }; // this is function which accepts funtion in parameter and then we use arrow funtion for ascync handle.

//butt after removeing brakets we get this async funciton
// const asyncHandler=(func)=>async()=>{}
/*
const asyncHandler = (func) => async (req, res, next) => {
  try {
    await func(req, res, next);
  } catch (error) {
    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};
*/
