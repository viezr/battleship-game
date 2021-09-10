/*
    Simple battleship game.
    Check guesses, rate. Some configuration in model object
    Ships generated random with rule: can't be connected by any side or corner
*/
function gen_table(div_table) {
    /*
        Generate table for game
    */
    let cell_size = model.cell_size;
    let border = model.cell_border;
    let table = document.createElement( "table" );
    let table_inner = "";
    let table_size = model.board_size + 1; // plus headers
    let head_col = "a".charCodeAt(0) - 1; // minus first cell
    for( let i = 0, k = 0, td_id = ""; i < table_size; i++) {
        table_inner += '<tr class="tr">';
        for( let j = 0; j < table_size; j++) {
            if( i == 0 ) {
                if( j == 0 ) {
                    table_inner += `<td class="td head-row" id="first-td"></td>`;
                } else {
                    table_inner += `<td class="td head-row">${j}</td>`;
                }
            } else {
                if( j == 0 ) {
                    head_col_name = String.fromCharCode(head_col + i).toUpperCase();
                    table_inner += `<td class="td head-col">${head_col_name}</td>`;
                } else {
                    td_id = String.fromCharCode(head_col + i) + j.toString();
                    model.full_locations.push( td_id );
                    table_inner += `<td class="td" id="${ td_id }"></td>`;
                }
            }
        }
        table_inner += "</tr>";
    }

    table.innerHTML = table_inner;
    div_table.append(table);

    table_tr = document.querySelectorAll(".tr");
    for( item in table_tr ) {
        if( table_tr[ item ].tagName =="TR" ) {
            table_tr[ item ].style.height = cell_size.toString() + "px";
        }
    }
    table_td = document.querySelectorAll(".td");
    for( item in table_td ) {
        if( table_td[ item ].tagName =="TD" ) {
            table_td[ item ].style.width = cell_size.toString() + "px";
            if( table_td[ item ].id  && table_td[ item ].id != "first-td") {
                table_td[ item ].style.border = border.toString() + "px solid #666";
            }
        }
    }
    let padding_blocks = [ "#title", "#status", "#buttons" ];
    for( item in padding_blocks ) {
        pad_block = document.querySelector( padding_blocks[ item ] );
        pad_block.style.paddingLeft = cell_size.toString() + "px";
    }
}

function show_canvas( location, state, size ) {
    /*
        Draw miss, hit and sunk pictures
    */
    if( typeof size == "undefined") {
        size = { w: 1, h: 1 };
    }
    let sprite_block = 40;
    let sprite = { x: 0, y: 0, w: (size.w * sprite_block), h: (size.h * sprite_block) };

    let rotate = false;
    if( state == "sunk" ) {
        if( size.w > 1 ) {
            sprite.y = sprite.w - sprite_block;
        } else if( size.h > 1 ) {
            sprite.x = 160 + sprite.h - sprite_block;
            rotate = true;
        }
    } else if( state == "hit" ) {
        sprite.x = 80;
    } else if( state == "miss" ) {
        sprite.x = 120;
    }

    size.w = size.w * (model.cell_size - model.cell_border);
    size.h = size.h * (model.cell_size - model.cell_border);
    let canvas = document.createElement( "canvas" );
    canvas.width = size.w.toString();
    canvas.height = size.h.toString();
    canvas.style.width = canvas.width + "px";
    canvas.style.height = canvas.height + "px";
    let ctx = canvas.getContext( "2d" );

    ctx.drawImage(view.sprites_image,
                  sprite.x, sprite.y, sprite.w, sprite.h,
                  0, 0, size.w, size.h);
    first_td = document.querySelector( "#" + location );
    first_td.append( canvas );
}

let view = {
    /*
        Change game view on user input
    */
    location: null,
    td_location: null,
    sprites_image: null,
    display_msg: function ( msg ) {
        div_msg = document.querySelector("#status");
        div_msg.innerHTML = msg;
    },
    set_location: function ( location ) {
        location = location.toLowerCase();
        this.td_location = document.querySelector(`#${location}`);
    },
    display_hit: function ( location ) {
        show_canvas( location, "hit" );
    },
    display_sunk: function ( location ) {
        if( location.length < 2 ) {
            for( let i = 0; i < location.length; i++ ) {
                this.set_location( location[ i ] );
                this.td_location.innerHTML = "";
                this.td_location.className += " sunk";
                show_canvas( location, "sunk" );
            }
        } else {
            // span table cells for ships bigger than 1
            this.set_location( location[ 0 ] );
            this.td_location.innerHTML = "";
            this.td_location.className += " sunk";
            if( location[ 0 ].charCodeAt(0) == location[ 1 ].charCodeAt(0) ) {
                this.td_location.colSpan = location.length;
                let ship_size = { w: location.length, h: 1 };
                show_canvas( location, "sunk", ship_size );
            } else {
                this.td_location.rowSpan = location.length;
                let ship_size = { w: 1, h: location.length };
                show_canvas( location, "sunk", ship_size );
            }
            for( let i = 1; i < location.length; i++ ) {
                this.set_location( location[ i ] );
                this.td_location.innerHTML = "";
                this.td_location.remove();
            }
        }
    },
    display_miss: function ( location ) {
        show_canvas( location, "miss" );
    }
};

let model = {
    /*
        Main game model configuration and logic
    */
    board_size: 10,
    cell_size: 42,
    cell_border: 2,
    ships_sunk: 0,
    hits: 0,
    rate: 0,
    ships_types: [ 4, 3, 3, 2, 2, 2, 1, 1, 1, 1 ],
    ships: [],
    full_locations: [],
    busy_locations: [],
    num_ships: 0,
    fire: function ( guess ) {
        guess = guess.toLowerCase();
        for( let i = 0; i < this.num_ships; i++ ) {
            let ship = this.ships[ i ];
            let index = ship.locations.indexOf( guess );
            if( index >= 0 ) {
                this.hits++;
                ship.hits[index] = true;
                if( this.is_sunk( ship ) ) {
                    this.ships_sunk++;
                    view.display_sunk( ship.locations );
                    view.display_msg( "You sank my battleship!" );
                } else {
                    view.display_hit( guess );
                    view.display_msg( "HIT!" );
                }
                return true;
            }
        }
        view.display_miss( guess );
        view.display_msg( "You missed!" );
        return false;
    },
    is_sunk: function ( ship ) {
        for( let i = 0; i < ship.locations.length; i++ ) {
            if( ship.hits[ i ] == false ) {
                return false;
            }
        }
        return true;
    },
    generate_ships: function () {
        /*
            Inintial ships generator with random locations
            By default ships can't be connected by any side or corner
        */
        view.display_msg( "Generating ships..." );
        let locations = [];
        for( size in this.ships_types ) {
            let k = 0;
            while( true ) {
                if( k > 20 ) {
                    console.log( `Generation abort. Attempts > ${ k } per ship`, );
                    view.display_msg( "Please, reload the page!" );
                    break;
                };
                locations = this.generate_ship( this.ships_types[ size ] );
                collision = this.ships_collision( locations );
                if( !collision ) {
                    for( let j = 0; j < locations.length; j++ ) {
                        this.busy_locations.push( locations[ j ] );
                    }
                    ship_hits = Array.from(Array( this.ships_types[ size ] ), () => false );
                    this.ships.push( { locations: locations, hits: ship_hits } )
                    break;
                }
                k++;
            }
            this.num_ships++;
        }
        view.display_msg( "Ready to start" );
    },
    generate_ship: function ( ship_length ) {
        /*
            Subfunction for generate_chips. Generate each ship
        */
        let locations = [];
        let vertical = Math.floor( Math.random() < 0.5 );
        let allowed_x_lane = 0;
        let allowed_y_lane = 0;
        let allowed_loc = this.full_locations.filter( (item) => {
            if( this.busy_locations.indexOf( item ) < 0 ) {
                return item;
            } } );
        if( ship_length > 1 ) {
            first_coord = allowed_loc[ Math.floor( Math.random() * allowed_loc.length ) ];
            let first_letter = first_coord[ 0 ].charCodeAt(0);
            let first_num = Number( first_coord.substring( 1 ) );
            if( vertical ) {
                let last_letter = "a".charCodeAt(0) + this.board_size;
                if( ( first_letter + ship_length ) > last_letter ) {
                    first_letter = "a".charCodeAt(0) + this.board_size - ship_length;
                }
            } else {
                let last_num = this.board_size;
                if( ( first_num + ship_length ) > last_num ) {
                    first_num = last_num - ship_length;
                }
            }
            first_letter = String.fromCharCode( first_letter );
            first_coord = first_letter + first_num.toString();
            locations.push( first_coord );

            let next_letter = "";
            let next_num = 0;
            let next_coord = "";
            for( let i = 1; i < ship_length; i++ ) {
                if( vertical ) {
                    next_letter = String.fromCharCode(
                                       first_letter.charCodeAt(0) + i
                                  );
                    next_coord = next_letter + first_num.toString();
                } else {
                    next_num = first_num + i;
                    next_coord = first_letter + next_num.toString();
                }
                locations.push( next_coord );
            }
        } else {
            next_coord = allowed_loc[ Math.floor( Math.random() * allowed_loc.length ) ];
            locations.push( next_coord );
        }
        return locations;
    },
    ships_collision: function ( locations ) {
        /*
            While generation, check ships collision
        */
        if( locations.length == 0 ) {
            return true;
        }
        new_busy = this.busy_locations.concat( this.busy_around( locations ) );
        this.busy_locations = new_busy;
        for( let i = 0; i < locations.length; i++ ) {
            busy_location = this.busy_locations.indexOf( locations[ i ] );
            if( busy_location >= 0 ) {
                return true;
            }
        }
        return false;
    },
    busy_around: function ( locations ) {
        /*
            While generation, check ships connections
        */
        let busy_arr = [];
        for( let i = 0; i < locations.length; i++ ) {
            let letter = locations[ i ][ 0 ].charCodeAt( 0 );
            let num = Number( locations[ i ].substring( 1 ) );
            busy_arr.push(
                String.fromCharCode( letter ) + ( num + 1 ).toString(),
                String.fromCharCode( letter ) + ( num - 1 ).toString(),
                String.fromCharCode( letter + 1 ) + num.toString(),
                String.fromCharCode( letter - 1 ) + num.toString(),
                String.fromCharCode( letter + 1 ) + ( num + 1 ).toString(),
                String.fromCharCode( letter + 1 ) + ( num - 1 ).toString(),
                String.fromCharCode( letter - 1 ) + ( num + 1 ).toString(),
                String.fromCharCode( letter - 1 ) + ( num - 1 ).toString()
            );
        }
        busy_arr = busy_arr.filter( (item) => {
                            if( locations.indexOf( item ) < 0 ) {
                                return item;
                            } } );
        return busy_arr;
    }
};

let controller = {
    /*
        Function for guess input from user
    */
    guesses: 0,
    game_over: false,
    process_guess: function ( guess ) {
        if( this.game_over ) {
            return view.display_msg(`Game over! Guesses: ${this.guesses}. Rate ${model.rate}`);
        }
        re_letter1 = String.fromCharCode( "a".charCodeAt(0) + model.board_size - 1 );
        re_letter2 = String.fromCharCode( "A".charCodeAt(0) + model.board_size - 1 );
        if( guess.length > 2 ) {
            re_num = `[0-1][0-${model.board_size - 10}]`;
        } else {
            re_num = model.board_size > 9 ? `[0-9]` : `[0-${model.board_size}]`;
        }
        re_str = `^[a-${re_letter1}A-${re_letter2}]${re_num}$`;
        re = new RegExp( re_str );
        if( guess.match(re) ) {
            model.fire( guess );
            this.guesses++;
        } else {
            return view.display_msg( "Wrong move. Check your input." );
        }
        if( model.ships_sunk == model.ships.length ) {
            this.game_over = true;
            model.rate = (this.guesses / model.hits).toPrecision(3);
            return view.display_msg(`Game over! Guesses: ${this.guesses}. Rate ${model.rate}`);
        }
    }
};

function handle_board(ev) {
    controller.process_guess( ev.target.id );
}

function handle_newgame_button() {
    location.reload();
}

function init() {
    /*
        Start point
    */
    let div_table = document.querySelector( "#board" );
    div_table.onclick = handle_board;
    let newgame_button = document.querySelector( "#new-btn" );
    newgame_button.onclick = handle_newgame_button;
    view.sprites_image = new Image();
    view.sprites_image.src = "img/ships.png";
    gen_table(div_table);
    model.generate_ships();
}

window.onload = init;
