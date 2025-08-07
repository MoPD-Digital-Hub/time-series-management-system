const useFetch = async (url) =>{
    let loading = true
    let response = await axios.get(url)
    try{
        loading = false
        return [loading, response.data]
    }catch(error){
        loading = false
        return [loading, error]
    }
}